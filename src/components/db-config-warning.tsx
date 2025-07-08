import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function DbConfigWarning() {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Not Configured</AlertTitle>
            <AlertDescription>
                Your MongoDB connection string is missing or incorrect. Please update the <code>MONGODB_URI</code> in your <code>.env</code> file to connect to your database. The application is currently running with no data.
            </AlertDescription>
        </Alert>
    )
}
