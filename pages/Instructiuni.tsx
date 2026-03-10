import { useState } from "react";
import { Bot, CalendarClock, Save, FileText, Settings as SettingsIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface InstructionWidget {
    id: string;
    title: string;
    description: string;
    placeholder: string;
    defaultValue: string;
    icon: any;
    disabled?: boolean;
}

export default function Instructiuni() {
    const { toast } = useToast();

    const [instructions, setInstructions] = useState<Record<string, string>>({
        service: "Bună ziua! Vă mulțumim că ați apelat service-ul nostru. Pentru a programa o vizită, vă rugăm să ne furnizați următoarele informații:\n\n1. Numele și prenumele dumneavoastră\n2. Numărul de telefon\n3. Marca și modelul vehiculului\n4. Data și ora preferată pentru programare\n5. Descrierea problemei sau serviciul dorit\n\nVă vom confirma programarea în cel mai scurt timp posibil.",

        orders: "Bună ziua! Pentru a plasa o comandă, vă rugăm să ne furnizați următoarele detalii:\n\n1. Numele complet\n2. Numărul de telefon\n3. Adresa de livrare\n4. Produsele dorite (cod sau descriere)\n5. Cantitatea pentru fiecare produs\n6. Metoda de plată preferată\n\nVă vom contacta pentru confirmarea comenzii și a detaliilor de livrare.",

        arrivals: "Bună ziua! Vă mulțumim că ați sosit pentru programarea dumneavoastră. Vă rugăm să vă înregistrați la recepție cu următoarele informații:\n\n1. Numele complet\n2. Numărul programării\n3. Ora sosirii\n\nEchipa noastră vă va asista în cel mai scurt timp posibil. Vă mulțumim pentru punctualitate!",

        confirmations: "Bună ziua! Confirmăm primirea comenzii dumneavoastră cu următoarele detalii:\n\n1. Număr comandă: [AUTO]\n2. Produse comandate: [LISTA]\n3. Valoare totală: [SUMA]\n4. Data estimată de livrare: [DATA]\n\nVeți primi un SMS de confirmare și veți fi contactat telefonic pentru detalii suplimentare. Vă mulțumim pentru comandă!"
    });

    const agents: InstructionWidget[] = [
        {
            id: "orders",
            title: "Agent Sunat comenzi sosite",
            description: "Agent automat pentru apelarea clienților la primirea comenzilor noi.",
            placeholder: "Introduceți instrucțiunile pentru plasarea comenzilor...",
            defaultValue: instructions.orders,
            icon: Bot,
        },
        {
            id: "service",
            title: "Agent preluare programari",
            description: "Agent automat pentru gestionarea și preluarea programărilor.",
            placeholder: "Introduceți instrucțiunile pentru programarea la service...",
            defaultValue: instructions.service,
            icon: CalendarClock,
        },
        {
            id: "arrivals",
            title: "Programari / Sosiri (În curând)",
            description: "Mesaj pentru clienții care au sosit pentru o programare.",
            placeholder: "Introduceți instrucțiunile pentru sosiri...",
            defaultValue: instructions.arrivals,
            icon: Bot,
            disabled: true,
        },
        {
            id: "confirmations",
            title: "Confirmare Comenzi (În curând)",
            description: "Template pentru confirmarea comenzilor plasate.",
            placeholder: "Introduceți template-ul de confirmare comenzi...",
            defaultValue: instructions.confirmations,
            icon: Bot,
            disabled: true,
        },
    ];

    const handleSave = (widgetId: string) => {
        // Here you would save to Supabase or your backend
        console.log(`Saving instructions for ${widgetId}:`, instructions[widgetId]);

        toast({
            title: "Salvat cu succes!",
            description: "Instrucțiunile au fost actualizate.",
        });
    };

    const handleChange = (widgetId: string, value: string) => {
        setInstructions(prev => ({
            ...prev,
            [widgetId]: value
        }));
    };

    return (
        <div className="p-6 space-y-4">
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Instrucțiuni Agenți</h1>
                    <p className="text-muted-foreground text-sm mt-1">Configurați instrucțiunile pentru agenții automatizați.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                        <Card
                            key={agent.id}
                            className={`flex flex-col transition-shadow hover:shadow-md ${agent.disabled ? "opacity-60" : ""}`}
                        >
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg">{agent.title}</CardTitle>
                                    <CardDescription className="mt-1 text-sm">{agent.description}</CardDescription>
                                </div>
                            </CardHeader>
                            {/* Give the text area an opacity mask or disabled property if the agent is disabled */}
                            <CardContent className="flex-1 flex flex-col gap-4">
                                <Textarea
                                    value={instructions[agent.id]}
                                    onChange={(e) => handleChange(agent.id, e.target.value)}
                                    placeholder={agent.placeholder}
                                    disabled={agent.disabled}
                                    className="min-h-[200px] resize-none font-mono text-sm"
                                />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        {instructions[agent.id].length} caractere
                                    </span>
                                    <Button
                                        onClick={() => handleSave(agent.id)}
                                        size="sm"
                                        disabled={agent.disabled}
                                        className="gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salvează
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

        </div>
    );
}
