var AWS = require('aws-sdk');
const s3Bucket = process.env.S3_BUCKET;
let output = {};

var s3 = new AWS.S3();
exports.handler = async(event) => {
    const userId = (event.requestContext.authorizer.phone_number).substr(1);
    let filePath = process.env.FILE_PATH + userId + '.png';

    const image = Buffer.from(event.body, 'base64');
    let ext = event.headers["Content-Type"].split("/");

    let pad = 0;
    if (event.body.endsWith('==')) {
        pad = 2;
    }
    else if (event.body.endsWith('=')) {
        pad = 1;
    }

    console.log(pad);
    var sizeInMB = ((event.body.length / 4) * 3 - pad) / 1000000;
    var maxImageSize = process.env.MAX_IMAGE_SIZE;
    var isImage = event.headers["Content-Type"].startsWith("image/");

    if (sizeInMB < maxImageSize && isImage) {
        var params = {
            "Body": image,
            "Bucket": s3Bucket,
            "Key": filePath,
            "Metadata": {
                "filename": userId,
                "fileExt": ext[1]
            }
        };

        await s3.putObject(params)
            .promise()
            .then(response => {
                console.log(response);
                output = {
                    statusCode: 200,
                    body: "Image uploaded successfully"
                };
            })
            .catch(err => {
                console.log(err);
                output = {
                    statusCode: 500,
                    body: "There was error uploading the image. Please try again."
                };
            });
    }
    else if (sizeInMB > maxImageSize) {
        output = {
            statusCode: 400,
            body: `Size of the image is ${sizeInMB}.the size should be less than 5 MB`
        };
    }
    else if (!isImage) {
        output = {
            statusCode: 400,
            body: "The file should be image."
        };
    }
    console.log(output.body);
    return output;
};
