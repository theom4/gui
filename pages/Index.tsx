import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, TrendingUp } from "lucide-react";
import { DashboardChart } from "@/components/DashboardChart";
import { MetricCard } from "@/components/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CallMetrics {
    total_apeluri: number;
    apeluri_initiate: number;
    apeluri_primite: number;
    rata_conversie: number;
    minute_consumate: number;
}

export default function Index() {
    const { profile, session } = useAuth();
    const [metrics, setMetrics] = useState<CallMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState("programari");
    const [dateStart, setDateStart] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [dateEnd, setDateEnd] = useState<Date | undefined>(new Date());

    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        console.log('[Dashboard] useEffect triggered. Profile:', profile);
        let isMounted = true;

        const fetchMetrics = async (attempt = 1) => {
            if (!profile?.id) {
                console.log('[Dashboard] No profile ID available yet.');
                return;
            }

            console.log(`[Dashboard] Fetching metrics for user (attempt ${attempt}):`, profile.id);
            try {
                console.log('[Dashboard] Starting Supabase query...');

                // Use session from AuthContext (already available from useAuth hook)
                console.log('[Dashboard] Session from AuthContext:', {
                    hasSession: !!session,
                    userId: session?.user?.id
                });

                if (!session) {
                    console.warn('[Dashboard] No active session in AuthContext');
                    setError('Nu există sesiune activă');
                    setLoading(false);
                    return;
                }

                let targetUserId = profile.id;

                try {
                    console.log('[Dashboard] Fetching from schema auth table users by email:', session.user.email);

                    // The user requested to fetch from auth.users by email to get the ID
                    const { data: authData, error: authErr } = await supabase
                        .schema('auth')
                        .from('users')
                        .select('id')
                        .eq('email', session.user.email)
                        .maybeSingle();

                    if (authData && authData.id) {
                        console.log('[Dashboard] Successfully retrieved id from auth.users:', authData.id);
                        targetUserId = authData.id;
                    } else if (authErr) {
                        console.warn('[Dashboard] Error fetching from auth.users (falling back to profile.id):', authErr);
                    }
                } catch (err) {
                    console.warn('[Dashboard] Exception fetching from auth.users:', err);
                }

                // Use direct fetch to bypass Supabase client timeout issues
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ympkyaakwveogjcgqqnr.supabase.co';
                const queryUrl = `${supabaseUrl}/rest/v1/call_metrics?user_id=eq.${targetUserId}&select=*&order=created_at.desc&limit=1`;

                console.log('[Dashboard] Starting direct fetch query for user_id:', targetUserId);

                const response = await fetch(queryUrl, {
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error('[Dashboard] Fetch error:', response.status, errorBody);
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                console.log('[Dashboard] Data received:', data);

                if (isMounted) {
                    if (data && Array.isArray(data) && data.length > 0) {
                        setMetrics(data[0] as CallMetrics);
                        setError(null);
                    } else {
                        console.log('[Dashboard] No metrics found for user.');
                        setMetrics(null);
                    }
                }
            } catch (err) {
                console.error('[Dashboard] Unexpected error:', err);
                if (isMounted) {
                    setError('Eroare neașteptată. Te rugăm să reîmprospătezi pagina.');
                }
            } finally {
                if (isMounted) {
                    console.log('[Dashboard] Setting loading to false');
                    setLoading(false);
                }
            }
        };

        fetchMetrics();

        // Safety timeout in case something hangs indefinitely
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                setLoading(prev => {
                    if (prev) {
                        console.warn('[Dashboard] Forced loading completion after timeout');
                        setError('Încărcarea durează prea mult. Te rugăm să reîmprospătezi pagina.');
                        return false;
                    }
                    return prev;
                });
            }
        }, 10000);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [profile?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Se încarcă panoul de control...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panou de Control</h1>
                    <p className="text-muted-foreground">
                        Statistici Robot
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Date Picker Start */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !dateStart && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateStart ? format(dateStart, "dd.MM.yyyy") : <span>De la</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateStart}
                                onSelect={setDateStart}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Date Picker End */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[150px] justify-start text-left font-normal",
                                    !dateEnd && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateEnd ? format(dateEnd, "dd.MM.yyyy") : <span>Până la</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateEnd}
                                onSelect={setDateEnd}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Select value={selectedView} onValueChange={setSelectedView}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="programari">Programari</SelectItem>
                            <SelectItem value="comenzi_plasate">Comenzi plasate</SelectItem>
                            <SelectItem value="comenzi_confirmate">Comenzi confirmate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-destructive">Problemă de conexiune</h3>
                            <p className="mt-1 text-sm text-destructive/80">{error}</p>
                            {retryCount > 0 && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Încercare {retryCount} din 3...
                                </p>
                            )}
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 text-sm font-medium text-destructive hover:text-destructive/80 underline"
                            >
                                Reîmprospătează pagina
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Apeluri"
                    value={metrics?.total_apeluri || 0}
                    description="Toate apelurile înregistrate"
                    icon={Phone}
                />
                <MetricCard
                    title="Apeluri Inițiate"
                    value={metrics?.apeluri_initiate || 0}
                    description="Apeluri efectuate"
                    icon={PhoneOutgoing}
                />
                <MetricCard
                    title="Apeluri Primite"
                    value={metrics?.apeluri_primite || 0}
                    description="Apeluri recepționate"
                    icon={PhoneIncoming}
                />
                <MetricCard
                    title="Minute Consumate"
                    value={metrics?.minute_consumate || 0}
                    description="Durata totală a apelurilor"
                    icon={Clock}
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
                <Card className="col-span-5">
                    <CardHeader>
                        <CardTitle>Imagine de Ansamblu a Activității</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <DashboardChart />
                    </CardContent>
                </Card>

                {/* Right side - stacked widgets */}
                <div className="col-span-3 flex flex-col gap-4">
                    {/* Circular Conversion Rate - Half height */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Rata de Conversie</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-2">
                            <div className="relative w-32 h-32">
                                {/* Background circle */}
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="52"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-muted/20"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="52"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - (metrics?.rata_conversie || 0) / 100)}`}
                                        className="text-blue-500 transition-all duration-500"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                {/* Percentage text */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold">
                                        {metrics?.rata_conversie?.toFixed(1) || '0.0'}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tichete create - Half height */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Tichete create</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-2">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-500">
                                    {metrics?.total_apeluri || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total tichete
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recent Activity Panel */}
            <Card>
                <CardHeader>
                    <CardTitle>Activitate recenta</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Telefon</th>
                                    <th scope="col" className="px-6 py-3">Acțiune</th>
                                    <th scope="col" className="px-6 py-3">Data</th>
                                    <th scope="col" className="px-6 py-3">Durată apel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Sample data - will be replaced with real data */}
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <tr key={item} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">+40 7XX XXX XXX</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Programare (sosire)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(Date.now() - item * 3600000).toLocaleDateString('ro-RO', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {Math.floor(Math.random() * 5) + 1}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Empty state for when there's no data */}
                        {(!metrics || metrics.total_apeluri === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nu există activitate recentă</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Empty State */}
            {!metrics && !loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nu există date încă</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Metricile apelurilor tale vor apărea aici odată ce începi să efectuezi apeluri.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
