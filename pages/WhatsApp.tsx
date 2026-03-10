import { MessageCircle } from "lucide-react";

export default function WhatsApp() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="rounded-full bg-muted p-5">
                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">WhatsApp nu este activat</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Contactează <span className="font-medium text-foreground">Nanoassist</span> pentru activare.
                </p>
            </div>
        </div>
    );
}

