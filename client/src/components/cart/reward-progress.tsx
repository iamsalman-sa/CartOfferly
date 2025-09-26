import { useEffect, useState } from "react";
import { CheckCircle, Gift } from "lucide-react";

interface RewardProgressProps {
  cartValue: number;
  onMilestoneUnlocked?: () => void;
}

const milestones = [
  { amount: 2500, label: "Free Delivery", type: "delivery", icon: "🚚" },
  { amount: 3000, label: "1 Free Product", type: "products", count: 1, icon: "🎁" },
  { amount: 4000, label: "2 Free Products", type: "products", count: 2, icon: "🎁" },
  { amount: 5000, label: "3 Free Products", type: "products", count: 3, icon: "🎁" }
];

export default function RewardProgress({ cartValue, onMilestoneUnlocked }: RewardProgressProps) {
  const [previousValue, setPreviousValue] = useState(cartValue);
  const [justUnlocked, setJustUnlocked] = useState<number[]>([]);

  useEffect(() => {
    // Check for newly unlocked milestones
    const newUnlocked = milestones.filter(m => 
      m.amount <= cartValue && m.amount > previousValue
    );
    
    if (newUnlocked.length > 0) {
      setJustUnlocked(newUnlocked.map(m => m.amount));
      onMilestoneUnlocked?.();
      
      // Clear the "just unlocked" state after animation
      setTimeout(() => setJustUnlocked([]), 3000);
    }
    
    setPreviousValue(cartValue);
  }, [cartValue]);

  const unlockedCount = milestones.filter(m => m.amount <= cartValue).length;
  const nextMilestone = milestones.find(m => m.amount > cartValue);
  const progressPercentage = Math.min((cartValue / 5000) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 milestone-glow border border-accent/20">
      {/* Current Status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground" data-testid="milestone-title">
            Milestone Rewards
          </h3>
          <p className="text-sm text-muted-foreground">
            Current cart value: <span className="font-bold text-foreground" data-testid="current-cart-value">
              PKR {cartValue.toLocaleString()}
            </span>
          </p>
        </div>
        {unlockedCount > 0 && (
          <div className="flex items-center space-x-2 bg-green-500/10 text-green-700 px-3 py-1 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium" data-testid="rewards-unlocked">
              {unlockedCount} Reward{unlockedCount !== 1 ? 's' : ''} Unlocked!
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>PKR 0</span>
          <span>PKR 5,000</span>
        </div>
        <div className="w-full bg-border rounded-full h-3 relative overflow-hidden">
          <div 
            className="progress-glow h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            data-testid="progress-bar"
          />
          {/* Milestone Markers */}
          <div className="absolute top-0 left-0 w-full h-full">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.amount}
                className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-card transition-all duration-300 ${
                  milestone.amount <= cartValue 
                    ? 'bg-green-500' 
                    : milestone.amount === nextMilestone?.amount
                    ? 'bg-accent animate-pulse'
                    : 'bg-muted'
                }`}
                style={{ left: `${(milestone.amount / 5000) * 100}%` }}
                data-testid={`milestone-marker-${milestone.amount}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Milestone Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {milestones.map((milestone) => {
          const isUnlocked = milestone.amount <= cartValue;
          const isJustUnlocked = justUnlocked.includes(milestone.amount);
          
          return (
            <div
              key={milestone.amount}
              className={`text-center p-3 rounded-lg border transition-all duration-500 ${
                isUnlocked 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : milestone.amount === nextMilestone?.amount
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-muted border-border'
              } ${isJustUnlocked ? 'animate-bounce-in milestone-glow' : ''}`}
              data-testid={`milestone-${milestone.amount}`}
            >
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                isUnlocked 
                  ? 'bg-green-500'
                  : milestone.amount === nextMilestone?.amount
                  ? 'bg-accent animate-pulse'
                  : 'bg-muted-foreground/20'
              }`}>
                {isUnlocked ? (
                  <CheckCircle className="text-white text-sm" />
                ) : milestone.amount === nextMilestone?.amount ? (
                  <Gift className="text-primary text-sm" />
                ) : (
                  <span className="text-xs">{milestone.icon}</span>
                )}
              </div>
              <p className={`text-xs font-medium ${
                isUnlocked 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-foreground'
              }`}>
                PKR {milestone.amount.toLocaleString()}
              </p>
              <p className={`text-xs ${
                isUnlocked 
                  ? 'text-green-600 dark:text-green-500' 
                  : 'text-muted-foreground'
              }`}>
                {milestone.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Next Milestone</p>
              <p className="text-xs text-muted-foreground">
                Add PKR {(nextMilestone.amount - cartValue).toLocaleString()} more to unlock {nextMilestone.label.toLowerCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-accent" data-testid="amount-to-next">
                PKR {(nextMilestone.amount - cartValue).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">to go</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
