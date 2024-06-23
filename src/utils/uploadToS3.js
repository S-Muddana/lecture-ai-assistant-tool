// utils/uploadToS3.js
import { s3, bedrockClient } from '../config/awsConfig';
import { StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
import { bedrockRuntimeClient } from '../config/awsConfig';
import { RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';


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

// export const uploadFile = async (videoId, transcript) => {
//     const S3_BUCKET = "lecture-youtube-transcript";
//     const REGION = "us-east-1";

//     AWS.config.update({
//       accessKeyId: "AKIAUTEKT5UZJMCERA7U",
//       secretAccessKey: "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",
//     });
//     const s3 = new AWS.S3({
//       params: { Bucket: S3_BUCKET },
//       region: REGION,
//     });

//     const params = {
//       Bucket: S3_BUCKET,
//       Key: `transcripts/${videoId}.json`,
//       Body: JSON.stringify(transcript),
//     };

//     var upload = s3
//       .putObject(params)
//       .on("httpUploadProgress", (evt) => {
//         console.log(
//           "Uploading " + parseInt((evt.loaded * 100) / evt.total) + "%"
//         );
//       })
//       .promise();

//     await upload.then((err, data) => {
//       console.log(err);
//       alert("File uploaded successfully.");
//     });
//   };