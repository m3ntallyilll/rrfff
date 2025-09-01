
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Users, Crown, Zap } from 'lucide-react';
const adminImage = "/images/Admin_dashboard_interface_39ab3175.png";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  battlesRemaining: number;
  totalBattles: number;
  totalWins: number;
  createdAt: string;
  lastBattleReset: string;
}

interface AdminUsersResponse {
  total: number;
  users: User[];
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest('/api/admin/users'),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-purple-600 text-white"><Crown className="w-3 h-3 mr-1" />Pro</Badge>;
      case 'premium':
        return <Badge className="bg-blue-600 text-white"><Zap className="w-3 h-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 relative">
      {/* Admin Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${adminImage})` }}
      />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users and system overview</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading users...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{data?.total || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Crown className="w-5 h-5" />
                    Pro Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">
                    {data?.users.filter(u => u.subscriptionTier === 'pro').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5" />
                    Premium Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">
                    {data?.users.filter(u => u.subscriptionTier === 'premium').length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User List</CardTitle>
                <CardDescription>All registered users and their subscription status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Tier</TableHead>
                      <TableHead className="text-gray-300">Battles</TableHead>
                      <TableHead className="text-gray-300">Wins</TableHead>
                      <TableHead className="text-gray-300">Remaining</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.map((user) => (
                      <TableRow key={user.id} className="border-gray-700">
                        <TableCell className="text-white">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || 'Unknown'
                          }
                        </TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell>{getTierBadge(user.subscriptionTier)}</TableCell>
                        <TableCell className="text-gray-300">{user.totalBattles}</TableCell>
                        <TableCell className="text-gray-300">{user.totalWins}</TableCell>
                        <TableCell className="text-gray-300">{user.battlesRemaining}</TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
