# Graph Report - smarteros-workspace  (2026-07-01)

## Corpus Check
- 159 files · ~100,652 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 858 nodes · 1266 edges · 149 communities (126 shown, 23 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `76076216`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_graphify|graphify.md]]
- [[_COMMUNITY_graphify|graphify.md]]
- [[_COMMUNITY_MEMORIA_GRAPHIFY|MEMORIA_GRAPHIFY.md]]
- [[_COMMUNITY_next.config.mjs|next.config.mjs]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_env-verify.sh|env-verify.sh]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_TenantData|TenantData]]
- [[_COMMUNITY_mockTenant|mockTenant]]
- [[_COMMUNITY_DEFAULT_URLS|DEFAULT_URLS]]
- [[_COMMUNITY_ServiceResult|ServiceResult]]
- [[_COMMUNITY_skills|skills]]
- [[_COMMUNITY_supabase|supabase]]
- [[_COMMUNITY_supabase-postgres-best-practices|supabase-postgres-best-practices]]
- [[_COMMUNITY_computedHash|computedHash]]
- [[_COMMUNITY_skillPath|skillPath]]
- [[_COMMUNITY_source|source]]
- [[_COMMUNITY_sourceType|sourceType]]
- [[_COMMUNITY_version|version]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `auth()` - 51 edges
3. `Button` - 17 edges
4. `getSupabaseClient()` - 17 edges
5. `compilerOptions` - 16 edges
6. `Badge()` - 13 edges
7. `ChatwootClient` - 12 edges
8. `Card` - 10 edges
9. `listTenantsForUser()` - 10 edges
10. `Input` - 9 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `auth()`  [EXTRACTED]
  app/api/mcp/route.ts → lib/auth.ts
- `NewTenantPage()` --calls--> `auth()`  [EXTRACTED]
  app/dashboard/tenant/new/page.tsx → lib/auth.ts
- `ThemeToggle()` --calls--> `cn()`  [EXTRACTED]
  components/theme-toggle.tsx → lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts

## Import Cycles
- 1-file cycle: `components/ui/input-otp.tsx -> components/ui/input-otp.tsx`
- 1-file cycle: `components/ui/sonner.tsx -> components/ui/sonner.tsx`

## Communities (149 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (10): GET(), Bucket, buckets, POST(), rateLimit(), ToolFn, tools, logMcpInvocation() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (12): onboardingSteps, plans, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (51): dependencies, autoprefixer, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (30): Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (37): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+29 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (26): POST(), POST(), POST(), ChatwootContact, chatwootContactSchema, ChatwootMessage, chatwootMessageSchema, createChatwootContact() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (7): ChatwootClient, ChatwootConfig, ChatwootContact, ChatwootConversation, ChatwootInbox, ChatwootMessage, ChatwootPayload

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (9): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, RadioGroup, RadioGroupItem (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (16): OnboardingDashboard(), DashboardPage(), PagoPage(), WorkspacePage(), HandleProps, PanelGroupProps, PanelProps, ResizableHandle() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (28): sharp, unrs-resolver, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, tailwindcss-animate (+20 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (13): ContactPayload, POST(), sendEmails(), EmailMessage, emailSchema, sendEcocuponValidatedEmail(), sendEmail(), sendPaymentReminderEmail() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.30
Nodes (9): POST(), POST(), createPhoneVerification(), generateCode(), hashCode(), normalizePhone(), sendWahaText(), verifyPhoneCode() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (13): GET(), GET(), PATCH(), POST(), proxyToSmarterApi(), GET(), POST(), proxyToHermes() (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (11): ALLOWED_PATHS, fastapiGet(), FastAPIGetSchema, fastapiPost(), FastAPIPostSchema, FastAPIToolNames, isPathAllowed(), ProvisionSchema (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (19): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (9): ResetPasswordPage(), LoginForm(), Input, Label, labelVariants, SignOutButton(), SupabaseClientUser, useSupabaseAuth() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (12): Badge(), BadgeProps, badgeVariants, Button, Progress, ScrollArea, ScrollBar, ContactAnalysis (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (11): ensureValue(), GET(), GET(), GET(), POST(), fetchBusinessSettings(), upsertBusinessSettings(), getEnv() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (4): missing, optional, required, snapshot

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (10): GET(), POST(), GET(), PATCH(), servicesUpdateSchema, createChatwootClient(), createTenant(), getTenantById() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.35
Nodes (11): buildSessionBody(), fetchWahaDirect(), GET(), normalizeSessionStatus(), parseResponsePayload(), POST(), proxyWahaDirect(), proxyWithFallback() (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (10): createTenant(), CreateTenantSchema, getTenantById(), listTenants(), requireUser(), TenantIdSchema, TenantSummary, TenantToolNames (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.28
Nodes (6): Avatar, AvatarFallback, AvatarImage, ConversationList(), ConversationListProps, WahaStatus

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 58 - "Community 58"
Cohesion: 0.52
Nodes (4): GET(), getCurrentUser(), requireUser(), createServerSupabaseClient()

### Community 59 - "Community 59"
Cohesion: 0.38
Nodes (6): config, isProtectedRoute(), isPublicRoute(), middleware(), protectedPrefixes, publicRoutes

### Community 60 - "Community 60"
Cohesion: 0.60
Nodes (3): GET(), GET(), listTenantsForUser()

### Community 61 - "Community 61"
Cohesion: 0.67
Nodes (3): integrationsUpdateSchema, PATCH(), updateTenantIntegrations()

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (4): THEME_CLASSES, ThemeName, ThemeToggle(), Switch

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (6): FormData, plans, Alert, AlertDescription, AlertTitle, alertVariants

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (4): Props, QUICK_ACTIONS, QuickAction, Textarea

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (4): NewTenantPage(), FormState, initialState, Step

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

## Knowledge Gaps
- **371 isolated node(s):** `ContactPayload`, `Bucket`, `buckets`, `tools`, `integrationsUpdateSchema` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 20` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 9`, `Community 12`, `Community 14`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 54`, `Community 56`, `Community 62`, `Community 63`, `Community 64`, `Community 66`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 2` to `Community 10`, `Community 43`, `Community 66`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `input-otp` connect `Community 66` to `Community 2`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `ContactPayload`, `Bucket`, `buckets` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06554621848739496 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07084785133565621 - nodes in this community are weakly interconnected._