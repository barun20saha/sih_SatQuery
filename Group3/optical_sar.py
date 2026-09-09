# Group 3 - Optical-SAR Change Detection
# Optical-SAR model, dataset and prediction-generation code.

import os
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms


# -----------------------------
# Optical-SAR Dataset
# -----------------------------
class OpticalSARDataset(Dataset):
    def __init__(self, optical_dir, sar_dir):
        self.optical_dir = optical_dir
        self.sar_dir = sar_dir

        self.optical_files = sorted(os.listdir(optical_dir))

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.optical_files)

    def __getitem__(self, index):
        optical_name = self.optical_files[index]

        # Match S2 optical image with the S1 SAR image.
        sar_name = optical_name.replace("_s2_", "_s1_")

        optical = Image.open(
            os.path.join(self.optical_dir, optical_name)
        ).convert("RGB")

        sar = Image.open(
            os.path.join(self.sar_dir, sar_name)
        ).convert("L")

        optical = self.transform(optical)
        sar = self.transform(sar)

        return optical, sar, optical_name


# -----------------------------
# Optical-SAR Change Detection Model
# -----------------------------
class OpticalSARChangeDetection(nn.Module):
    def __init__(self):
        super().__init__()

        # Optical branch
        self.optical_encoder = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )

        # SAR branch
        self.sar_encoder = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )

        # Fusion
        self.fusion = nn.Sequential(
            nn.Conv2d(256, 128, 3, padding=1),
            nn.ReLU(),

            nn.Conv2d(128, 64, 3, padding=1),
            nn.ReLU()
        )

        # Decoder
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64, 32, 2, stride=2),
            nn.ReLU(),

            nn.ConvTranspose2d(32, 16, 2, stride=2),
            nn.ReLU(),

            nn.Conv2d(16, 1, 1)
        )

    def forward(self, t1, t2, sar):
        f1 = self.optical_encoder(t1)
        f2 = self.optical_encoder(t2)
        fsar = self.sar_encoder(sar)

        optical_difference = torch.abs(f1 - f2)

        combined = torch.cat(
            [f1, f2, optical_difference, fsar],
            dim=1
        )

        fused = self.fusion(combined)

        return self.decoder(fused)


# -----------------------------
# Paths
# -----------------------------
BASE = "/content/drive/MyDrive/LEVIR-CD"
OPTICAL_DIR = os.path.join(BASE, "optical_sar", "optical")
SAR_DIR = os.path.join(BASE, "optical_sar", "sar")

MODEL_PATH = os.path.join(
    BASE,
    "optical_sar_change_detection.pth"
)

OUTPUT_DIR = os.path.join(
    BASE,
    "Group3_OpticalSAR_Results"
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# -----------------------------
# Load trained model
# -----------------------------
def load_model(model_path=MODEL_PATH):
    model = OpticalSARChangeDetection().to(DEVICE)

    state_dict = torch.load(
        model_path,
        map_location=DEVICE
    )

    model.load_state_dict(state_dict)
    model.eval()

    return model


# -----------------------------
# Generate Optical-SAR predictions
# -----------------------------
def generate_predictions(model):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    dataset = OpticalSARDataset(
        OPTICAL_DIR,
        SAR_DIR
    )

    loader = DataLoader(
        dataset,
        batch_size=1,
        shuffle=False,
        num_workers=0
    )

    print("Generating Optical-SAR predictions...")

    with torch.no_grad():
        for i, (optical, sar, optical_name) in enumerate(loader):

            optical = optical.to(DEVICE)
            sar = sar.to(DEVICE)

            output = model(
                optical,
                sar
            )

            prediction = torch.sigmoid(output)
            prediction = (prediction > 0.5).float()

            prediction = prediction.squeeze().cpu().numpy()

            prediction_image = Image.fromarray(
                (prediction * 255).astype("uint8")
            )

            name = optical_name[0].replace(
                "_s2_",
                "_prediction_"
            )

            prediction_image.save(
                os.path.join(OUTPUT_DIR, name)
            )

            if (i + 1) % 50 == 0:
                print(
                    "Processed:",
                    i + 1
                )

    print("Optical-SAR predictions completed.")
    print("Saved to:", OUTPUT_DIR)


if __name__ == "__main__":
    model = load_model()
    print("Optical-SAR model loaded successfully.")
    print(
        "Model parameters:",
        sum(p.numel() for p in model.parameters())
    )
    generate_predictions(model)
