'use server'

import { createAdminClient } from "../appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./users.actions";

const handelError = (error : unknown , message : string )=> {
    console.log(error , message);
    throw error;
}


export const uploadFile = async ({file, ownerId , accountId , path } : UploadFileProps) => {
    const {storage , databases} = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file , file.name);

        const bucketFile = await storage.createFile(appwriteConfig.bucketId , ID.unique() , inputFile);

        const fileDocument = {
            type : getFileType(bucketFile.name).type,
            name : bucketFile.name,
            url : constructFileUrl(bucketFile.$id),
            extension : getFileType(bucketFile.name).extension,
            size : bucketFile.sizeOriginal,
            owner : ownerId,
            accountId,
            users : [],
            bucketFileId : bucketFile.$id,
        };

        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            ID.unique(),
            fileDocument
        ).catch(async(error : unknown) => {
            await storage.deleteFile(appwriteConfig.bucketId , bucketFile.$id);
            handelError(error , 'Failed to create file document');
        });

        revalidatePath(path);
        return parseStringify(newFile)

    } catch (error) {
        handelError(error , 'Failed to upload file');
    }
}

const createQueries = (currentUser : Models.Document) => {
    const queries = [
        Query.or([
            Query.equal('owner' , [currentUser.$id]),
            Query.contains('users' , [currentUser.email]),

        ])
    ];

    // TODO : Search , sort , limit 
    return queries;
}
export const getFiles = async()=> {
    const {databases} = await createAdminClient();

    try {
        
        const currentUser = await getCurrentUser();

        if(!currentUser) throw new Error('User not found');

        const queries = createQueries(currentUser);


        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries
        ).catch((error : unknown) => {
            handelError(error , 'Failed to get files');
        });


        return parseStringify(files);

    } catch (error) {
        handelError(error , 'Failed to get files');
    }
}