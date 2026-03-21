import { useNavigate } from "react-router-dom";
import { GraduationCap, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)" }}
    >
      <div className="text-center space-y-6 max-w-md">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-white/20 rounded-xl p-2">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <span className="text-xl font-bold text-white">QuestionCraft AI</span>
        </div>

        {/* 404 */}
        <div className="space-y-2">
          <p className="text-8xl font-black text-white/20 select-none">404</p>
          <h1 className="text-2xl font-bold text-white">Page not found</h1>
          <p className="text-white/70 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => navigate("/")}
            className="bg-white text-blue-700 hover:bg-white/90 font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-white/40 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        <p className="text-white/40 text-xs pt-4">
          Kalasalingam Academy of Research and Education
        </p>
      </div>
    </div>
  );
};

export default NotFound;
