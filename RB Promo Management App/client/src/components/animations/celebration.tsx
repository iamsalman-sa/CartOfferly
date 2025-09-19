import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  speed: number;
}

export default function CelebrationAnimation() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#f4d03f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'][Math.floor(Math.random() * 6)],
        rotation: Math.random() * 360,
        speed: 2 + Math.random() * 3,
      });
    }
    setConfetti(pieces);

    // Animate confetti falling
    const animationInterval = setInterval(() => {
      setConfetti(prev => 
        prev.map(piece => ({
          ...piece,
          y: piece.y + piece.speed,
          rotation: piece.rotation + 5,
        })).filter(piece => piece.y < 110)
      );
    }, 50);

    // Clean up after animation
    setTimeout(() => {
      clearInterval(animationInterval);
      setConfetti([]);
    }, 3000);

    return () => clearInterval(animationInterval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" data-testid="celebration-animation">
      {/* Confetti pieces */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 transition-transform duration-50"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
          }}
          data-testid={`confetti-piece-${piece.id}`}
        />
      ))}
      
      {/* Celebration message */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="text-center bg-card/90 backdrop-blur-md rounded-lg p-8 border border-accent/30 animate-bounce-in milestone-glow">
          <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-2xl">⭐</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2 font-serif" data-testid="celebration-title">
            Congratulations!
          </h3>
          <p className="text-muted-foreground mb-4" data-testid="celebration-message">
            You unlocked <strong>new rewards</strong> — choose them now!
          </p>
          
          <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg p-4 border border-accent/30">
            <div className="flex items-center justify-center space-x-2 text-accent-foreground">
              <span className="text-accent">🏆</span>
              <span className="font-semibold">Milestone Achieved</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Keep shopping to unlock more rewards!
            </p>
          </div>
        </div>
      </div>

      {/* Sparkle effects */}
      <div className="fixed inset-0">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-accent rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-accent rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
}
