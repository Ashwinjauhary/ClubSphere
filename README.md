# ClubSphere

A modern, comprehensive college club management platform built with React, TypeScript, and Supabase.

## Features

- 🎯 **Role-Based Access Control** - Separate interfaces for Students, Club Admins, and Deans
- 📅 **Event Management** - Create, approve, and manage club events
- 🤖 **AI-Powered Reports** - Generate event reports using Google Gemini AI
- 📊 **Analytics Dashboard** - Track club activities and engagement
- 🔔 **Real-time Notifications** - Stay updated on applications and approvals
- 📱 **PWA Support** - Install as a standalone app with offline capabilities
- 🎨 **Modern UI/UX** - Beautiful, responsive design with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini API
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/Ashwinjauhary/ClubSphere.git
cd ClubSphere
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Set up Supabase
- Run the SQL scripts in the root directory to set up tables and RLS policies
- Configure authentication in Supabase dashboard

5. Start development server
```bash
npm run dev
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## Project Structure

```
ClubSphere/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── layouts/        # Layout components
│   ├── services/       # API services
│   ├── store/          # Zustand stores
│   ├── utils/          # Utility functions
│   └── lib/            # Third-party integrations
├── public/             # Static assets
└── supabase/           # Database schemas and migrations
```

## Features in Detail

### For Students
- Browse and join clubs
- Register for events
- Track applications
- View activity timeline

### For Club Admins
- Manage club details and members
- Create and edit events
- Submit event reports with AI assistance
- Review membership applications

### For Deans
- Approve/reject event proposals
- View analytics across all clubs
- Monitor club activities
- Access comprehensive reports

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

**Ashwin Jauhary**
- GitHub: [@Ashwinjauhary](https://github.com/Ashwinjauhary)

## Acknowledgments

- Built with ❤️ for college communities
- Powered by Supabase and Google Gemini AI
