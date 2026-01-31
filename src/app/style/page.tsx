import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StylePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header>
        <h1 className="font-serif text-3xl">Style Sandbox</h1>
        <p className="text-sm text-muted-foreground">
          Components and typography preview.
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Memorial Card</CardTitle>
          <CardDescription>
            A quiet surface for long-form memories and notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This space can hold reflections, dates, and stories with a soft,
            respectful tone.
          </p>
        </CardContent>
      </Card>

      <section className="flex flex-wrap gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Dialog</DialogTitle>
              <DialogDescription>
                Dialogs support confirmations and gentle prompts.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>First action</DropdownMenuItem>
            <DropdownMenuItem>Second action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    </div>
  );
}
