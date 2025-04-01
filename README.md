The HeartLen App is a web-based tool designed to process photoplethysmography (PPG) signals captured via a webcam. It calculates heart rate, heart rate variability (HRV), and signal quality using machine learning models. The processed data can be saved to a MongoDB database for further analysis.

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/kitmanlam/BIOF3003_asm.git
   cd app
   npm install
2. Create a .env.local file in the root directory and add your MongoDB connection string
   MONGODB_URI=your_mongodb_connection_string

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Connecting to MongoDB

To link the app to your MongoDB database:
1. Create a MongoDB Atlas cluster or use a local MongoDB instance.
2. Copy the connection string from MongoDB Atlas and paste it into the `.env.local` file as shown above.
3. Ensure the database has a collection named `records` to store PPG data.


### Deployment

To deploy the app:
1. Build the production version:
   ```bash
   npm run build
   ```
2. Once the build succeeds, test your app locally by running:
    ```bash
    npm run start
    ```
3. Push Your Code to GitHub
   - Create a new repository on GitHub:
   - Go to GitHub and click the "+" icon in the top-right corner, then select "New repository."
   - Name your repository (e.g., heartlen-app) and choose whether to make it public or private.
   - Do not initialize the repository with a README, .gitignore, or license file.
   - Update the remote origin URL in your local repository:
     ```bash
     git remote set-url origin https://github.com/your-username/your-repo-name.git
     ```
   Replace your-username and your-repo-name with your GitHub username and repository name.
   - Verify the updated remote URL:
      ```bash
      git remote -v
      ```
   - Commit and push your changes:
     ```bash
     git add .
     git commit -m "Initial commit with completed HeartLen app"
     git push origin main
     ```

## Deploy to Vercel

1. Sign up for a free Vercel account
   Go to Vercel and sign up using your GitHub account.

2. Import your GitHub repository
   - In the Vercel dashboard, click "Add New" and select "Project."
   - Choose "Import Project from GitHub" and authorize Vercel to access your repositories.
   - Select the repository you just pushed (e.g., heartlen-app).

3. Configure the deployment settings:
   - Environment Variables: Add the required environment variables for your app (e.g., MONGODB_URI).
   - Click "Environment Variables" and add the key-value pairs needed for your app to connect to MongoDB.
      Example:
         Key: MONGODB_URI
         Value: mongodb+srv://<username>:<password>@cluster0.nmjaz.mongodb.net/?retryWrites=true&w=majority
   - Build and Deployment: Change the install command into npm install --legacy-peer-deps to bypass peer dependency conflicts
   
4. Deploy your app
   - Click "Deploy" to start the deployment process.
   - Vercel will automatically build and deploy your app. Once complete, you'll receive a live URL (e.g., https://heartlen-app.vercel.app)

5. Test your deployed app
   - Open the live URL provided by Vercel and verify that your app works as expected.
   - Check that features like recording, sampling, and saving data to MongoDB function correctly.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
