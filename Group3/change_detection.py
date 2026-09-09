# Group 3 - LEVIR-CD Change Detection
# This file contains the main change-detection model, training,
# evaluation, and checkpoint-saving code used in the Colab work.

import os
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms


# -----------------------------
# Dataset
# -----------------------------
class LEVIRCDDataset(Dataset):
    def __init__(self, A_dir, B_dir, label_dir, image_size=128):
        self.A_dir = A_dir
        self.B_dir = B_dir
        self.label_dir = label_dir

        self.files = sorted([
            f for f in os.listdir(A_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))
        ])

        self.image_transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor()
        ])

        self.label_transform = transforms.Compose([
            transforms.Resize(
                (image_size, image_size),
                interpolation=transforms.InterpolationMode.NEAREST
            ),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.files)

    def __getitem__(self, index):
        filename = self.files[index]

        img_t1 = Image.open(
            os.path.join(self.A_dir, filename)
        ).convert("RGB")

        img_t2 = Image.open(
            os.path.join(self.B_dir, filename)
        ).convert("RGB")

        label = Image.open(
            os.path.join(self.label_dir, filename)
        ).convert("L")

        img_t1 = self.image_transform(img_t1)
        img_t2 = self.image_transform(img_t2)
        label = self.label_transform(label)

        label = (label > 0.5).float()

        return img_t1, img_t2, label


# -----------------------------
# Change Detection Model
# -----------------------------
class ChangeDetectionModel(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
            nn.Conv2d(128, 64, 3, padding=1),
            nn.ReLU(),

            nn.ConvTranspose2d(64, 32, 2, stride=2),
            nn.ReLU(),

            nn.ConvTranspose2d(32, 16, 2, stride=2),
            nn.ReLU(),

            nn.Conv2d(16, 1, 1)
        )

    def forward(self, img_t1, img_t2):
        features_t1 = self.encoder(img_t1)
        features_t2 = self.encoder(img_t2)

        difference = torch.abs(features_t1 - features_t2)

        return self.decoder(difference)


# -----------------------------
# Evaluation
# -----------------------------
def evaluate(model, loader, device):
    model.eval()

    total_correct = 0
    total_pixels = 0
    tp = 0
    fp = 0
    fn = 0

    with torch.no_grad():
        for img_t1, img_t2, labels in loader:
            img_t1 = img_t1.to(device)
            img_t2 = img_t2.to(device)
            labels = labels.float().to(device)

            output = model(img_t1, img_t2)

            labels = torch.nn.functional.interpolate(
                labels,
                size=output.shape[-2:],
                mode="nearest"
            )

            prediction = (torch.sigmoid(output) > 0.5).float()
            labels = (labels > 0.5).float()

            total_correct += (prediction == labels).sum().item()
            total_pixels += labels.numel()

            tp += ((prediction == 1) & (labels == 1)).sum().item()
            fp += ((prediction == 1) & (labels == 0)).sum().item()
            fn += ((prediction == 0) & (labels == 1)).sum().item()

    accuracy = total_correct / total_pixels
    iou = tp / (tp + fp + fn + 1e-8)
    precision = tp / (tp + fp + 1e-8)
    recall = tp / (tp + fn + 1e-8)
    f1 = 2 * precision * recall / (precision + recall + 1e-8)

    return accuracy, iou, precision, recall, f1


# -----------------------------
# Example training setup
# -----------------------------
# Set these paths before running.
TRAIN_BASE = "/content/drive/MyDrive/LEVIR-CD/train"
A_DIR = os.path.join(TRAIN_BASE, "A")
B_DIR = os.path.join(TRAIN_BASE, "B")
LABEL_DIR = os.path.join(TRAIN_BASE, "label")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


if __name__ == "__main__":
    dataset = LEVIRCDDataset(A_DIR, B_DIR, LABEL_DIR)
    loader = DataLoader(
        dataset,
        batch_size=8,
        shuffle=True,
        num_workers=0
    )

    model = ChangeDetectionModel().to(DEVICE)

    # Weighted loss used in the later Group 3 experiment.
    pos_weight = torch.tensor([20.8]).to(DEVICE)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.0005
    )

    epochs = 5

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for img_t1, img_t2, labels in loader:
            img_t1 = img_t1.to(DEVICE)
            img_t2 = img_t2.to(DEVICE)
            labels = labels.float().to(DEVICE)

            prediction = model(img_t1, img_t2)

            labels = torch.nn.functional.interpolate(
                labels,
                size=prediction.shape[-2:],
                mode="nearest"
            )

            loss = criterion(prediction, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        average_loss = total_loss / len(loader)
        print(
            f"Epoch [{epoch + 1}/{epochs}] "
            f"Loss: {average_loss:.6f}"
        )

    print("Training completed.")
