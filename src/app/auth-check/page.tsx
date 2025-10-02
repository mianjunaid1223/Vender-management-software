import { getSession } from '@/core/auth/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

export default async function AuthCheck() {
  const session = await getSession()

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>
            Current session and user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Authenticated
                </Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">User ID:</span> {session.id}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {session.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {session.email}
                </div>
                <div>
                  <span className="font-medium">Company ID:</span> {session.companyId}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Badge variant="destructive">
                Not Authenticated
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                You are not logged in. Please log in to access this information.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
