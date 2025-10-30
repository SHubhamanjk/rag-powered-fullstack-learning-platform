import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Medha.ai Logo" className="w-6 h-6 object-contain" />
            <span className="text-lg font-bold text-primary">Medha.ai</span>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-4 text-sm leading-7">
          <p>
            We value your privacy. This page explains what information we collect, how we use it, and your choices.
          </p>
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>
            Account data (email), usage data (feature interactions), and content you choose to upload (e.g., study materials) are processed to provide the service.
          </p>
          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <p>
            To authenticate you, deliver features (notes, quizzes, chat), improve performance, and secure the platform.
          </p>
          <h2 className="text-xl font-semibold">Your Choices</h2>
          <p>
            You can access, update, or delete your data. Contact support for any privacy-related requests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;


