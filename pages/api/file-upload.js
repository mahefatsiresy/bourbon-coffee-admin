// pages/api/file-upload.js

import formidable from "formidable";
import { promises as fsPromises } from "fs";
import path from "path";
import { MongoClient, ObjectId } from 'mongodb';

// Désactive le bodyParser de Next.js pour gérer les fichiers
export const config = {
    api: {
        bodyParser: false,
    }
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    let database, collection;

    // connection au base de donnée sur cloud.mongodb
    try {
        await client.connect();
        database = client.db("bourbon");
        collection = database.collection("files");
    } catch (error) {
        console.error("Error connecting to database:", error);
        return res.status(500).json({ error: "Failed to connect to database" });
    }

    if (req.method === "POST") {
        const uploadDir = path.join(process.cwd(), "public", "file_uploads");
        try {
            await fsPromises.mkdir(uploadDir, { recursive: true });
            console.log("Upload directory exists or created:", uploadDir);
        } catch (mkdirError) {
            console.error("Error creating upload directory:", mkdirError);
            return res.status(500).json({ error: "Failed to create upload directory" });
        }

        const form = formidable({
            uploadDir: uploadDir,
            maxFileSize: Infinity,
            keepExtensions: true,
            filename: (name, ext, part, form) => {
                // Génère un nom de fichier unique
                return `${Date.now()}-${part.originalFilename}`;
            }
        });

        // Promisifier form.parse
        const parseForm = () => {
            return new Promise((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ fields, files });
                    }
                });
            });
        };

        try {
            const { fields, files } = await parseForm();
            console.log("Parsed fields:", fields);
            console.log("Parsed files:", files);

            // **Assurez-vous que le nom correspond**
            const file = Array.isArray(files.file) ? files.file[0] : files.file;

            console.log("Processed file:", file);

            if (!file) {
                console.error("No file found in upload.");
                return res.status(400).json({ error: "No file uploaded" });
            }

            const newFilename = file.newFilename || file.originalFilename;
            if (!newFilename) {
                console.error("Neither newFilename nor originalFilename is defined.");
                return res.status(400).json({ error: "Invalid file data" });
            }

            const filePath = path.join(uploadDir, newFilename);
            console.log("File path:", filePath);

            // **Formidable déplace déjà le fichier dans uploadDir, donc rename n'est pas nécessaire**
            // Si vous souhaitez le déplacer ailleurs, décommentez et ajustez le code ci-dessous
            /*
            const finalDir = path.join(process.cwd(), "uploads"); // Exemple
            await fsPromises.mkdir(finalDir, { recursive: true });
            const finalPath = path.join(finalDir, newFilename);
            await fsPromises.rename(file.filepath, finalPath);
            */

            // Insérer dans MongoDB
            try {
                const result = await collection.insertOne({
                    fileName: file.originalFilename,
                    filePath: filePath,
                    uploadDate: new Date()
                });

                console.log("File inserted into DB with ID:", result.insertedId);

                return res.status(200).json({
                    message: "File uploaded successfully and saved to database",
                    filePath,
                    databaseId: result.insertedId
                });
            } catch (dbError) {
                console.error("Error saving to database:", dbError);
                return res.status(500).json({ error: "Failed to save file information to database" });
            }

        } catch (error) {
            console.error("Error during file upload:", error);
            return res.status(500).json({ error: "Failed to upload file" });
        } finally {
            try {
                await client.close();
            } catch (closeError) {
                console.error("Error closing MongoDB connection:", closeError);
            }
        }

    } else if (req.method === "GET") {
        // Gérer la méthode GET
        try {
            const files = await collection.find().toArray();
            return res.status(200).json(files);
        } catch (error) {
            console.error("Error fetching files:", error);
            return res.status(500).json({ error: "Failed to fetch files" });
        } finally {
            try {
                await client.close();
            } catch (closeError) {
                console.error("Error closing MongoDB connection:", closeError);
            }
        }
    } else if (req.method === "PUT") {
        const { id, newFileName } = req.body;
        if (!id || !newFileName) {
            return res.status(400).json({ error: "Missing id or newFileName" });
        }

        try {
            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { fileName: newFileName } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "File not found" });
            }

            return res.status(200).json({ message: "File updated successfully" });
        } catch (error) {
            console.error("Error updating file:", error);
            return res.status(500).json({ error: "Failed to update file" });
        } finally {
            try {
                await client.close();
            } catch (closeError) {
                console.error("Error closing MongoDB connection:", closeError);
            }
        }
    } else if (req.method === "DELETE") {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: "Missing file id" });
        }

        try {
            const file = await collection.findOne({ _id: new ObjectId(id) });
            if (!file) {
                return res.status(404).json({ error: "File not found" });
            }

            await fsPromises.unlink(file.filePath);
            await collection.deleteOne({ _id: new ObjectId(id) });

            return res.status(200).json({ message: "File deleted successfully" });
        } catch (error) {
            console.error("Error deleting file:", error);
            return res.status(500).json({ error: "Failed to delete file" });
        } finally {
            try {
                await client.close();
            } catch (closeError) {
                console.error("Error closing MongoDB connection:", closeError);
            }
        }
    } else {
        res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}