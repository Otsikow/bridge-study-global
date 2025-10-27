import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  active: boolean;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-500',
      staff: 'bg-purple-500',
      agent: 'bg-blue-500',
      partner: 'bg-green-500',
      student: 'bg-gray-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
