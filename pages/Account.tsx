import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Clock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Account() {
    const { profile } = useAuth();
    const [minuteConsumate, setMinuteConsumate] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMinutes = async () => {
            if (!profile?.id) return;

            try {
                const { data, error } = await supabase
                    .from('call_metrics')
                    .select('minute_consumate')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('[Account] Error fetching minutes:', error);
                } else if (data) {
                    setMinuteConsumate(data.minute_consumate || 0);
                }
            } catch (err) {
                console.error('[Account] Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMinutes();
    }, [profile?.id]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cont Utilizator</h1>
                    <p className="text-muted-foreground">
                        Informații despre contul și utilizarea dumneavoastră
                    </p>
                </div>
            </div>

            {/* Account Information Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informații Profil
                        </CardTitle>
                        <CardDescription>Detalii despre contul dumneavoastră</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Nume</p>
                                <p className="text-base font-semibold">
                                    {profile?.full_name || 'Utilizator'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                                <p className="text-base font-semibold capitalize">
                                    {profile?.role || 'User'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Statistici Utilizare
                        </CardTitle>
                        <CardDescription>Informații despre activitatea dumneavoastră</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Minute Consumate</p>
                                {loading ? (
                                    <p className="text-2xl font-bold text-blue-600">Se încarcă...</p>
                                ) : (
                                    <p className="text-3xl font-bold text-blue-600">
                                        {minuteConsumate.toLocaleString('ro-RO')} min
                                    </p>
                                )}
                                <p className="text-xs text-blue-700 mt-1">
                                    Total minute de apeluri înregistrate
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-primary mb-1">
                                Informații despre cont
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Această pagină afișează informațiile despre contul dumneavoastră și statisticile
                                de utilizare. Pentru a modifica setările aplicației, accesați pagina "Setări"
                                din meniul principal.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
