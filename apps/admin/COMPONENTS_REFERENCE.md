# shadcn/ui Components Quick Reference

This guide provides quick examples for all installed shadcn/ui components in the admin portal.

## Component Import Pattern

All components are imported from `@/components/ui/[component-name]`:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

## Basic Components

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// With Icons (Lucide)
import { Mail } from "lucide-react"
<Button>
  <Mail className="mr-2 h-4 w-4" />
  Login with Email
</Button>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colors
<Badge className="bg-green-500">Success</Badge>
<Badge className="bg-yellow-500">Warning</Badge>
```

### Input

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>

// With disabled state
<Input disabled placeholder="Disabled input" />
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Election Statistics</CardTitle>
    <CardDescription>Current election metrics</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Total Votes: 1,234</p>
    <p>Turnout: 67%</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

## Form Components

### Form (with React Hook Form + Zod)

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  electionName: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
})

export function ElectionForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      electionName: "",
      description: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="electionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Election Name</FormLabel>
              <FormControl>
                <Input placeholder="Presidential Election" {...field} />
              </FormControl>
              <FormDescription>
                This will be displayed to voters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Election</Button>
      </form>
    </Form>
  )
}
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="draft">Draft</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="closed">Closed</SelectItem>
  </SelectContent>
</Select>

// In Form
<FormField
  control={form.control}
  name="status"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Status</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <label
    htmlFor="terms"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Accept terms and conditions
  </label>
</div>

// In Form
<FormField
  control={form.control}
  name="enableNotifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Email notifications</FormLabel>
        <FormDescription>
          Receive updates about this election
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Type your message here." />

// With character limit
<div className="grid w-full gap-1.5">
  <Label htmlFor="message">Your message</Label>
  <Textarea
    id="message"
    placeholder="Type your message here."
    className="resize-none"
    rows={4}
  />
  <p className="text-sm text-muted-foreground">
    Your message will be displayed to voters.
  </p>
</div>
```

### Switch

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

## Navigation Components

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input id="name" value="Pedro Duarte" className="col-span-3" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With icons
import { User, Settings, LogOut } from "lucide-react"

<DropdownMenuContent>
  <DropdownMenuItem>
    <User className="mr-2 h-4 w-4" />
    Profile
  </DropdownMenuItem>
  <DropdownMenuItem>
    <Settings className="mr-2 h-4 w-4" />
    Settings
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem>
    <LogOut className="mr-2 h-4 w-4" />
    Logout
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Sheet (Mobile Navigation)

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
      <SheetDescription>
        Access your account settings
      </SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 py-4">
      <Button variant="ghost" className="justify-start">Dashboard</Button>
      <Button variant="ghost" className="justify-start">Elections</Button>
      <Button variant="ghost" className="justify-start">Settings</Button>
    </div>
  </SheetContent>
</Sheet>

// Different sides
<SheetContent side="left">   // left, right, top, bottom
```

## Data Display

### Table

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const elections = [
  { id: "1", name: "Presidential", status: "Active", votes: 1234 },
  { id: "2", name: "Congressional", status: "Draft", votes: 0 },
]

<Table>
  <TableCaption>A list of all elections</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Votes</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {elections.map((election) => (
      <TableRow key={election.id}>
        <TableCell className="font-medium">{election.name}</TableCell>
        <TableCell>
          <Badge>{election.status}</Badge>
        </TableCell>
        <TableCell className="text-right">{election.votes}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Election overview and stats</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Overview content here</p>
      </CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="analytics">
    Analytics content
  </TabsContent>
  <TabsContent value="reports">
    Reports content
  </TabsContent>
</Tabs>
```

## Common Patterns

### Loading State

```tsx
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>
```

### Error State

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to save election. Please try again.
  </AlertDescription>
</Alert>
```

### Responsive Layout

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

## Styling Utilities

### cn() Function

Merge classes with proper conflict resolution:

```tsx
import { cn } from "@/lib/utils"

<Button className={cn(
  "base-class",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

## Resources

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
