import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MapViewer } from '@/components/MapViewer';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isApproved, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!isApproved && !isAdmin) {
        navigate('/auth');
      }
    }
  }, [user, isApproved, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-board-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isApproved && !isAdmin)) {
    return null;
  }

  return <MapViewer />;
};

export default Index;
