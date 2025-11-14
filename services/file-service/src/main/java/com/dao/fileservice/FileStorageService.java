package com.dao.fileservice;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import com.dao.fileservice.config.FileUploadProperties;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path tempStorageLocation;
    private final Cloudinary cloudinary;
    private final String uploadFolder;

    public FileStorageService(
            FileUploadProperties fileUploadProperties,
            Cloudinary cloudinary,
            @Value("${cloudinary.upload-folder:code-spark}") String uploadFolder) {
        this.tempStorageLocation = Paths.get(fileUploadProperties.getUploadDir()).toAbsolutePath().normalize();
        this.cloudinary = cloudinary;
        this.uploadFolder = uploadFolder;
        
        try {
            Files.createDirectories(this.tempStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the temporary directory for uploads.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Generate a unique file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        try {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } catch (Exception e) {
            // No extension
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            // Check if the file's name contains invalid characters
            if (fileName.contains("..")) {
                throw new RuntimeException("Invalid file name: " + fileName);
            }

            // Create a temporary file
            Path tempFile = this.tempStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);

            // Upload to Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                tempFile.toFile(),
                ObjectUtils.asMap(
                    "public_id", uploadFolder + "/" + fileName.replace(fileExtension, ""),
                    "resource_type", "auto"
                )
            );

            // Delete the temporary file
            Files.deleteIfExists(tempFile);

            // Return the secure URL of the uploaded file
            return (String) uploadResult.get("secure_url");
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}
