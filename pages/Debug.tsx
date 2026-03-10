import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugDashboard() {
    const { profile, session } = useAuth();
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        const runDiagnostics = async () => {
            const info: any = {
                timestamp: new Date().toISOString(),
                authContext: {
                    profileId: profile?.id,
                    profileRole: profile?.role,
                    sessionUserId: session?.user?.id,
                    sessionEmail: session?.user?.email,
                },
                tests: {}
            };

            // Test 1: Get session directly
            const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
            info.tests.sessionCheck = {
                userId: freshSession?.user?.id,
                email: freshSession?.user?.email,
                error: sessionError?.message
            };

            // Test 2: Query call_metrics with hardcoded ID
            const { data: hardcodedData, error: hardcodedError } = await supabase
                .from('call_metrics')
                .select('*')
                .eq('user_id', 'e69c35d9-f5e8-45de-8b71-fbde02efbb45');

            info.tests.hardcodedQuery = {
                rowCount: hardcodedData?.length,
                data: hardcodedData,
                error: hardcodedError?.message
            };

            // Test 3: Query call_metrics with profile.id
            if (profile?.id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('call_metrics')
                    .select('*')
                    .eq('user_id', profile.id);

                info.tests.profileIdQuery = {
                    rowCount: profileData?.length,
                    data: profileData,
                    error: profileError?.message
                };
            }

            // Test 4: Query call_metrics without filter (to see all accessible rows)
            const { data: allData, error: allError } = await supabase
                .from('call_metrics')
                .select('*');

            info.tests.noFilterQuery = {
                rowCount: allData?.length,
                data: allData,
                error: allError?.message
            };

            // Test 5: Check profiles table
            if (profile?.id) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', profile.id)
                    .single();

                info.tests.profilesQuery = {
                    data: profilesData,
                    error: profilesError?.message
                };
            }

            setDebugInfo(info);
        };

        if (profile) {
            runDiagnostics();
        }
    }, [profile, session]);

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>🔍 Debug Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
