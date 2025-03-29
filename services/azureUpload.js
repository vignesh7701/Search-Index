const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.CONTAINER_NAME;
const containerClient = blobServiceClient.getContainerClient(containerName);

// Function to upload file to Azure Blob Storage
exports.uploadFileToAzure = async (file) => {
    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(file.buffer, file.size);
    return {
        blobName,
        fieldname: file.fieldname,
        fileURL: blockBlobClient.url
    };
};

// Function to delete file from Azure Blob Storage
exports.deleteFileFromAzure = async (blobName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
};


