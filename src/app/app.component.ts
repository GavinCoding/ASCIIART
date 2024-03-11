import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ImageCropperModule } from 'ngx-image-cropper';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule,ImageCropperModule,FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'UI';
  currentFileUpload?: File;
  imageUrl?: string;
  fileDropped = false;
  brightnessArray: string[][] = [];
  asciiArt: string = '';
  sensitivity: number = 0.1;
  

  constructor(private cdr: ChangeDetectorRef) {}

  handleFileInput(files: FileList | null | undefined) {
    if (files && files.length > 0) {
      this.currentFileUpload = files.item(0)!;
      this.previewFile(this.currentFileUpload);
      this.fileDropped = true;
    }
  }

  submit() {
    if (this.currentFileUpload) {
      console.log(this.currentFileUpload);
      this.loadImageAndCalculateBrightness();
      this.generateAsciiArt();
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  previewFile(file: File | null) {
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imageUrl = reader.result as string;
        this.loadImageAndCalculateBrightness();
      };
    }
  }

  loadImageAndCalculateBrightness() {
    if (this.imageUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 75; // Adjust as needed
        const targetHeight = 40; // Adjust as needed

        const imageAspectRatio = img.width / img.height;
        const asciiAspectRatio = targetWidth / targetHeight;

        let scaleFactorWidth = targetWidth / img.width;
        let scaleFactorHeight = targetHeight / img.height;

        if (imageAspectRatio > asciiAspectRatio) {
          // Original image is wider than ASCII art
          scaleFactorHeight *= imageAspectRatio / asciiAspectRatio;
        } else {
          // Original image is taller than ASCII art
          scaleFactorWidth *= asciiAspectRatio / imageAspectRatio;
        }

        const scaledWidth = img.width * scaleFactorWidth;
        const scaledHeight = img.height * scaleFactorHeight;

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
          const brightnessArray = this.calculateBrightness(imageData);
          this.brightnessArray = this.mapBrightnessToCharacters(brightnessArray);
        }
      };
      img.onerror = (error) => {
        console.error('Error loading image:', error);
      };
      img.src = this.imageUrl;
    }
}
  calculateBrightness(imageData: ImageData): number[][] {
    const brightnessArray: number[][] = [];
  
    for (let y = 0; y < imageData.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < imageData.width; x++) {
        const index = (y * imageData.width + x) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        
        // Calculate brightness
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        row.push(brightness);
      }
      brightnessArray.push(row);
    }
  
    return brightnessArray;
  }
  mapBrightnessToCharacters(brightnessArray: number[][]): string[][] {
    const customCharacterSet = '$@B%#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.'; // Adjust as needed
    const mappedArray: string[][] = [];
    const step = 1 / customCharacterSet.length;
    
    for (let i = 0; i < brightnessArray.length; i++) {
      const row = brightnessArray[i];
      const mappedRow: string[] = [];
      for (let j = 0; j < row.length; j++) {
        const brightness = row[j];
        const adjustedBrightness = brightness * (1 - this.sensitivity) + this.sensitivity; // Adjust brightness based on sensitivity
        const mappedChar = customCharacterSet.charAt(Math.floor(adjustedBrightness * customCharacterSet.length));
        mappedRow.push(mappedChar);
      }
      mappedArray.push(mappedRow);
    }
    return mappedArray;
  }
  
  

  generateAsciiArt() {
    // Convert brightnessArray to ASCII art
    let ascii = '';
    for (let row of this.brightnessArray) {
      ascii += row.join('') + '\n';
    }
    this.asciiArt = ascii;
    console.log(this.asciiArt);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Drag over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Drag leave');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    this.handleFileInput(files);
    console.log('Drop');
  }
}
