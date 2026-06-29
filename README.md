# AI WhatsApp Sales Assistant for Small Businesses

[![Frontend Dashboard](https://img.shields.io/badge/Vercel-Frontend-black?style=for-the-badge&logo=vercel)](https://salessaarthi.vercel.app/)
[![Backend Server](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://salessaarthi-8iue.onrender.com)

A complete full-stack system where customers interact via WhatsApp, and an AI assistant automatically handles sales, replies, product queries, and lead generation. Includes a business dashboard for analytics and product management.

## Deployed Links

*   **Frontend Dashboard:** [https://salessaarthi.vercel.app/](https://salessaarthi.vercel.app/)
*   **Backend API Server:** [https://salessaarthi-8iue.onrender.com](https://salessaarthi-8iue.onrender.com)

## Features

- **WhatsApp Integration**: Automated responses via Twilio WhatsApp API
- **AI-Powered**: Smart responses using Groq API with Llama3 model
- **Product Management**: Add, edit, delete products with inventory tracking
- **Lead Capture**: Automatic user stage tracking (new, interested, converted)
- **Analytics Dashboard**: Real-time stats, charts, and conversation history
- **Smart Logic**: Contextual responses for pricing, products, and orders

## Tech Stack

### Backend
- Node.js & Express.js
- Firebase Firestore (Database)
- Twilio WhatsApp API
- Groq API (AI responses)

### Frontend
- React.js with TypeScript
- Tailwind CSS
- Chart.js (Analytics)
- Axios (API calls)

## Project Structure

```
SalesSaarthi AI/
backend/
  |-- server.js              # Main server file
  |-- firebase.js            # Firebase configuration
  |-- .env                   # Environment variables
  |-- seedData.js            # Sample data script
  |-- controllers/           # Route controllers
  |-- routes/               # API routes
  |-- services/             # External API services
frontend/
  |-- src/
    |-- pages/              # React pages
    |-- services/           # API service
    |-- App.tsx             # Main app component
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project
- Twilio account
- Groq API key

### 2. Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Groq API Configuration
   GROQ_API_KEY=your_groq_api_key

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_CLIENT_ID=your_firebase_client_id
   FIREBASE_AUTH_URI=your_firebase_auth_uri
   FIREBASE_TOKEN_URI=your_firebase_token_uri
   ```

4. **Get API Keys**

   **Twilio Setup:**
   - Sign up at [Twilio Console](https://www.twilio.com/console)
   - Get your Account SID and Auth Token
   - Create a WhatsApp sandbox
   - Note your Twilio phone number

   **Groq API:**
   - Sign up at [Groq Console](https://console.groq.com)
   - Generate an API key

   **Firebase Setup:**
   - Create a new project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Go to Service Accounts and generate a private key
   - Copy the JSON content to your .env file

5. **Seed sample data (optional)**
   ```bash
   node seedData.js
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### 3. Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend**
   ```bash
   npm start
   ```

   The dashboard will run on `http://localhost:3000`

## API Endpoints

### Webhook
- `POST /webhook` - Receive WhatsApp messages from Twilio
- `GET /webhook` - Webhook health check

### Products
- `GET /products` - Get all products
- `POST /products` - Add a new product
- `PUT /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

### Analytics
- `GET /analytics` - Get dashboard analytics
- `GET /analytics/users` - Get user statistics

### Health
- `GET /health` - Server health check
- `GET /` - API documentation

## WhatsApp Setup

1. **Configure Twilio Webhook**
   - In Twilio Console, go to your WhatsApp sandbox
   - Set the webhook URL to: `http://your-domain.com/webhook`
   - For local testing, use ngrok: `ngrok http 5000`

2. **Test the WhatsApp Bot**
   - Join your Twilio WhatsApp sandbox
   - Send messages like:
     - "products" - See product list
     - "price" - Check pricing
     - "buy" - Start order process

## Dashboard Features

### Dashboard Home
- Total users, messages, leads, conversion rate
- Messages over time chart
- User distribution chart
- Recent activity feed

### Products Management
- Add/edit/delete products
- Inventory tracking
- Stock status indicators

### Chat History
- View all conversations
- Search and filter chats
- Export conversation data

## Smart Response Logic

The AI assistant automatically handles different types of messages:

- **Price inquiries**: Shows product pricing
- **Product requests**: Displays product catalog
- **Order requests**: Guides through purchase process
- **General queries**: Uses AI for contextual responses

## Deployment

### Backend (Heroku/Render)
1. Push code to GitHub
2. Connect repository to deployment platform
3. Set environment variables in deployment settings
4. Deploy and note the URL

### Frontend (Vercel/Netlify)
1. Update API base URL in `frontend/src/services/api.ts`
2. Connect repository to deployment platform
3. Deploy automatically

### Environment Variables for Production
- All variables from `.env` file
- Add webhook URL: `https://your-domain.com/webhook`

## Testing

1. **Backend Testing**
   ```bash
   cd backend
   npm test
   ```

2. **Frontend Testing**
   ```bash
   cd frontend
   npm test
   ```

3. **Manual Testing**
   - Start both backend and frontend
   - Add sample products via dashboard
   - Test WhatsApp responses
   - Verify analytics data

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Verify service account credentials
   - Check Firestore database rules

2. **Twilio Webhook Not Working**
   - Ensure webhook URL is publicly accessible
   - Check ngrok tunnel if testing locally

3. **Groq API Error**
   - Verify API key is valid
   - Check rate limits and billing

4. **CORS Issues**
   - Backend should handle CORS properly
   - Verify frontend API URL

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with love for small businesses!**
