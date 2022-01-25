#! /usr/bin/env node

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { generateBatchCsv } = require("../../../public/js/functions")

require("./functions/get-active-batch").handle(batch => {
  require("./functions/get-batch").handle({ batch: batch.batch }).then(rawData => {
    const filename = 'batch.csv',
    fileType = 'text/csv',
    data = generateBatchCsv(rawData);
  
    const msg = {
      to: process.env.EMAILS.split(','),
      from: 'hello@nanopass.io',
      subject: 'Black Box CSV',
      text: 'Attached',
      attachments: [
          {
              content: data.toString('base64'),
              filename: filename,
              type: fileType,
              disposition: 'attachment',
          },
      ],
    };
  
    sgMail
      .send(msg)
      .then(() => console.log('Mail sent successfully'))
      .catch(error => console.error(error.toString()));
  })
})
