import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bot, CalendarClock, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

interface AgentToggle {
    id: string;
    title: string;
    description: string;
    icon: any;
    disabled?: boolean;
}

export default function Settings() {
    const { toast } = useToast();

    const [activeAgents, setActiveAgents] = useState<Record<string, boolean>>({
        orders: true,
        service: true,
        arrivals: false,
        confirmations: false
    });

    const agents: AgentToggle[] = [
        {
            id: "orders",
            title: "Agent Sunat comenzi sosite",
            description: "Activează sau dezactivează asistentul vocal pentru comenzi.",
            icon: Bot,
        },
        {
            id: "service",
            title: "Agent preluare programari",
            description: "Activează sau dezactivează asistentul pentru programări la service.",
            icon: CalendarClock,
        },
        {
            id: "arrivals",
            title: "Programari / Sosiri (În curând)",
            description: "Activează primirea mesajelor de sosire pentru clienți.",
            icon: Phone,
            disabled: true,
        },
        {
            id: "confirmations",
            title: "Confirmare Comenzi (În curând)",
            description: "Activează template-urile de confirmare prin SMS/apel.",
            icon: Bot,
            disabled: true,
        }
    ];

    const handleToggle = (agentId: string, checked: boolean) => {
        setActiveAgents(prev => ({
            ...prev,
            [agentId]: checked
        }));

        toast({
            title: "Setare actualizată",
            description: `Agentul a fost ${checked ? "activat" : "dezactivat"}.`,
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Setări Agenți</h1>
                    <p className="text-muted-foreground">
                        Activează sau dezactivează agenții automatizați
                    </p>
                </div>
            </div>

            {/* Instruction Widgets Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {agents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                        <Card key={agent.id} className={`flex flex-col ${agent.disabled ? "opacity-60" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-start gap-4 space-y-0">
                                    <div className="rounded-lg bg-primary/10 p-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg">{agent.title}</CardTitle>
                                        <CardDescription className="mt-1">{agent.description}</CardDescription>
                                    </div>
                                </div>
                                <Switch
                                    checked={activeAgents[agent.id]}
                                    onCheckedChange={(checked) => handleToggle(agent.id, checked)}
                                    disabled={agent.disabled}
                                    aria-label={`Toggle ${agent.title}`}
                                />
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <SettingsIcon className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                                Gestionarea Agenților
                            </h3>
                            <p className="text-sm text-blue-800">
                                Folosiți comutatoarele de mai sus pentru a activa sau dezactiva anumiți agenți asistenți. Un agent dezactivat nu va mai efectua sau prelua apeluri. Puteți edita instrucțiunile specifice ("prompts") în pagina <strong>Instrucțiuni</strong>.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
