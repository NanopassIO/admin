import * as sgMail from '@sendgrid/mail';
import * as getActiveBatch from './functions/get-active-batch';
import * as getBatch from './functions/get-batch';
import generateBatchCsv from '../../../public/js/functions'

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

getActiveBatch.handle(batch => {
  getBatch.handle({ batch: batch.batch }).then(rawData => {
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
