import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Support = () => {
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

        <h1 className="text-3xl font-bold mb-4">Support</h1>
        <p className="text-muted-foreground mb-6">We’re here to help you succeed.</p>

        <div className="space-y-4 text-sm leading-7">
          <p>Reach us through any of the following:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Email: <a className="text-primary hover:underline" href="mailto:shubham07kumargupta@gmail.com">shubham07kumargupta@gmail.com</a></li>
            <li>Contact form: <a className="text-primary hover:underline" href="/contact">Go to Contact</a></li>
          </ul>
          <h2 className="text-xl font-semibold">FAQ</h2>
          <p>Common setup and troubleshooting steps will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default Support;


