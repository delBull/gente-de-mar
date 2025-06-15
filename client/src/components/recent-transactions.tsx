import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
  id: number;
  tourName: string;
  amount: string;
  status: string;
  createdAt: Date;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  isLoading: boolean;
}

export default function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transacciones Recientes</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transacciones Recientes</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay transacciones recientes
          </p>
        </CardContent>
      </Card>
    );
  }

  // Default images for different tour types
  const getDefaultImage = (tourName: string) => {
    if (tourName.toLowerCase().includes('bahía') || tourName.toLowerCase().includes('bay')) {
      return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60";
    }
    if (tourName.toLowerCase().includes('snorkel') || tourName.toLowerCase().includes('arcos')) {
      return "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60";
    }
    if (tourName.toLowerCase().includes('catamarán') || tourName.toLowerCase().includes('catamaran')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60";
    }
    return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60";
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transacciones Recientes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver Todo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src={getDefaultImage(transaction.tourName)}
                  alt={transaction.tourName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{transaction.tourName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.createdAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  +${parseFloat(transaction.amount).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {transaction.status === 'completed' ? 'Completado' : transaction.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
