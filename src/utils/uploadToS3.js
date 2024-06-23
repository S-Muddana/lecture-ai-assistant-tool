// utils/uploadToS3.js
import { s3, bedrockClient } from '../config/awsConfig';
import { StartIngestionJobCommand, GetIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
import { bedrockRuntimeClient } from '../config/awsConfig';
import { RetrieveCommand, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';


export const uploadToS3 = async (videoId, transcript) => {
  const params = {
    Bucket: 'lecture-youtube-transcript', // Your bucket name
    Key: `transcripts/${videoId}.json`,
    Body: JSON.stringify(transcript),
    ContentType: 'application/json'
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Returns the URL of the uploaded transcript
  } catch (error) {
    console.error('Error uploading transcript to S3:', error);
    return null;
  }
};

export const checkIngestionJobStatus = async (ingestionJobId) => {
    const params = {
        knowledgeBaseId: 'CTQRMSSF30', // Replace with your Knowledge Base ID
        dataSourceId: '3T7UFLW0F8',   // Use the provided Data Source ID
      ingestionJobId,  // Use the provided Ingestion Job ID
    };
  
    try {
      const command = new GetIngestionJobCommand(params);
      const response = await bedrockClient.send(command);
      console.log('Ingestion job status:', response.ingestionJob.status);
      return response.ingestionJob.status; // Return the current status
    } catch (error) {
      console.error('Error checking ingestion job status:', error);
      return null;
    }
  };

export const startIngestionJob = async () => {
    const params = {
      knowledgeBaseId: 'CTQRMSSF30', // Replace with your Knowledge Base ID
      dataSourceId: '3T7UFLW0F8', // Replace with your Data Source ID
    };
  
    try {
      const command = new StartIngestionJobCommand(params);
      const result = await bedrockClient.send(command);
      console.log('Ingestion job started:', result);
      return result.ingestionJob.ingestionJobId; // Return the job ID for further tracking
    } catch (error) {
      console.error('Error starting ingestion job:', error);
    }
  };

  // utils/queryBedrock.js


export const queryKnowledgeBase = async (queryText) => {
  const params = {
    knowledgeBaseId: 'CTQRMSSF30', // Replace with your Knowledge Base ID
    retrievalQuery: {
      text: queryText, // Query text from user input
    }
  };

  try {
    const command = new RetrieveCommand(params);
    const response = await bedrockRuntimeClient.send(command);
    console.log('Query response:', response);
    return response.retrievalResults; // Return the results for further processing
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    return null;
  }
};

export const retrieveAndGenerate = async (queryText) => {
    const params = {
      input: {
        text: queryText, // User query
      },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: 'CTQRMSSF30', // Replace with your Knowledge Base ID
          modelArn: 'amazon.titan-text-premier-v1:0' // Replace with your model ARN
        }
      }
    };
  
    try {
      const command = new RetrieveAndGenerateCommand(params);
      const response = await bedrockRuntimeClient.send(command);
      console.log('Retrieve and Generate response:', response);
      return response; // Return the response for further processing
    } catch (error) {
      console.error('Error in retrieve and generate:', error);
      return null;
    }
  };
