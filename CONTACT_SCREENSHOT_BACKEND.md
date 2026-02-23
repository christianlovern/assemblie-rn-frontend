# Contact / Report Issue – Screenshot in email (backend)

The mobile app sends issue reports to your **POST /api/contact** endpoint. When the user attaches a screenshot, the app includes it in the JSON body so it can be attached to the outgoing email.

## What the app sends

- **Without screenshot:** normal JSON body (`name`, `email`, `message`, `organizationName`, `platform`, `appVersion`, `isInquiry`, `subject`, optional `template`).
- **With screenshot:** same fields **plus**:
    - **`screenshotBase64`** – string, base64-encoded JPEG (resized/compressed on the app, typically &lt; 200 KB decoded).

## What the backend must do

1. **Read the field**  
   After parsing the JSON body (e.g. `req.body`), check for `screenshotBase64`:
    - If missing or empty → send the email as you do today (no attachment).
    - If present → decode and attach it to the email.

2. **Decode and attach**  
   Decode the base64 string to a buffer and add it as an attachment. Example (Node/Nodemailer):

    ```js
    const attachments = [];
    if (req.body.screenshotBase64) {
    	attachments.push({
    		filename: 'screenshot.jpg',
    		content: Buffer.from(req.body.screenshotBase64, 'base64'),
    	});
    }
    await transporter.sendMail({
    	to: '...',
    	subject: req.body.subject,
    	text: req.body.message,
    	html: `...${req.body.message}...`,
    	attachments,
    });
    ```

3. **Optional**
    - You can embed the image in the HTML with a cid (content-id) so it shows inline, or keep it as a simple attachment so the recipient can open `screenshot.jpg`.
    - No need to persist `screenshotBase64` or the image; use it only for the email and then discard.

Once the backend adds this handling, the screenshot will appear as an attachment (or inline, if you implement cid) in the issue report emails.
