import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Save, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface InstructionWidget {
    id: string;
    title: string;
    description: string;
    placeholder: string;
    defaultValue: string;
}

export default function Settings() {
    const { toast } = useToast();

    const [instructions, setInstructions] = useState<Record<string, string>>({
        service: "Bună ziua! Vă mulțumim că ați apelat service-ul nostru. Pentru a programa o vizită, vă rugăm să ne furnizați următoarele informații:\n\n1. Numele și prenumele dumneavoastră\n2. Numărul de telefon\n3. Marca și modelul vehiculului\n4. Data și ora preferată pentru programare\n5. Descrierea problemei sau serviciul dorit\n\nVă vom confirma programarea în cel mai scurt timp posibil.",

        orders: "Bună ziua! Pentru a plasa o comandă, vă rugăm să ne furnizați următoarele detalii:\n\n1. Numele complet\n2. Numărul de telefon\n3. Adresa de livrare\n4. Produsele dorite (cod sau descriere)\n5. Cantitatea pentru fiecare produs\n6. Metoda de plată preferată\n\nVă vom contacta pentru confirmarea comenzii și a detaliilor de livrare.",

        arrivals: "Bună ziua! Vă mulțumim că ați sosit pentru programarea dumneavoastră. Vă rugăm să vă înregistrați la recepție cu următoarele informații:\n\n1. Numele complet\n2. Numărul programării\n3. Ora sosirii\n\nEchipa noastră vă va asista în cel mai scurt timp posibil. Vă mulțumim pentru punctualitate!",

        confirmations: "Bună ziua! Confirmăm primirea comenzii dumneavoastră cu următoarele detalii:\n\n1. Număr comandă: [AUTO]\n2. Produse comandate: [LISTA]\n3. Valoare totală: [SUMA]\n4. Data estimată de livrare: [DATA]\n\nVeți primi un SMS de confirmare și veți fi contactat telefonic pentru detalii suplimentare. Vă mulțumim pentru comandă!"
    });

    const widgets: InstructionWidget[] = [
        {
            id: "service",
            title: "Instrucțiuni Programare Service",
            description: "Instrucțiuni pentru clienții care doresc să programeze o vizită la service",
            placeholder: "Introduceți instrucțiunile pentru programarea la service...",
            defaultValue: instructions.service
        },
        {
            id: "orders",
            title: "Instrucțiuni Plasare Comenzi",
            description: "Ghid pentru clienții care doresc să plaseze o comandă",
            placeholder: "Introduceți instrucțiunile pentru plasarea comenzilor...",
            defaultValue: instructions.orders
        },
        {
            id: "arrivals",
            title: "Instrucțiuni Programare (sosire)",
            description: "Mesaj pentru clienții care au sosit pentru o programare",
            placeholder: "Introduceți instrucțiunile pentru sosiri...",
            defaultValue: instructions.arrivals
        },
        {
            id: "confirmations",
            title: "Instrucțiuni Confirmare Comenzi",
            description: "Template pentru confirmarea comenzilor plasate",
            placeholder: "Introduceți template-ul de confirmare comenzi...",
            defaultValue: instructions.confirmations
        }
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Setări</h1>
                    <p className="text-muted-foreground">
                        Configurați instrucțiunile pentru diferite procese de business
                    </p>
                </div>
            </div>

            {/* Instruction Widgets Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {widgets.map((widget) => (
                    <Card key={widget.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{widget.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                        {widget.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Textarea
                                value={instructions[widget.id]}
                                onChange={(e) => handleChange(widget.id, e.target.value)}
                                placeholder={widget.placeholder}
                                className="min-h-[200px] resize-none font-mono text-sm"
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                    {instructions[widget.id].length} caractere
                                </span>
                                <Button
                                    onClick={() => handleSave(widget.id)}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Salvează
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
                                Cum să folosiți instrucțiunile
                            </h3>
                            <p className="text-sm text-blue-800">
                                Aceste instrucțiuni vor fi folosite automat în comunicarea cu clienții.
                                Puteți folosi variabile precum [AUTO], [LISTA], [SUMA], [DATA] care vor fi
                                înlocuite automat cu informațiile relevante din sistem.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
