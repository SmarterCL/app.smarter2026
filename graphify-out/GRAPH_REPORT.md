# Graph Report - smarteros-workspace  (2026-06-21)

## Corpus Check
- 156 files · ~101,942 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 787 nodes · 1267 edges · 62 communities (54 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec9fedb0`
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
- [[_COMMUNITY_Community 16|Community 16]]
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
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 70 edges
2. `dependencies` - 53 edges
3. `auth()` - 45 edges
4. `Button` - 17 edges
5. `compilerOptions` - 16 edges
6. `getSupabaseClient()` - 15 edges
7. `GET()` - 14 edges
8. `devDependencies` - 13 edges
9. `Badge()` - 13 edges
10. `POST()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `DashboardPage()` --calls--> `useSupabaseUser()`  [EXTRACTED]
  app/dashboard/page.tsx → lib/supabase-auth-client.tsx
- `ThemeToggle()` --calls--> `cn()`  [EXTRACTED]
  components/theme-toggle.tsx → lib/utils.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts

## Communities (62 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (69): GET(), GET(), tenantCreateSchema, GET(), POST(), GET(), integrationsUpdateSchema, PATCH() (+61 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (44): Props, QUICK_ACTIONS, QuickAction, DashboardPage(), mockTenant, canPerformAction(), Plan, PlanId (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (52): dependencies, autoprefixer, class-variance-authority, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+44 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (36): useIsMobile(), Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+28 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (36): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (26): POST(), ChatwootContact, chatwootContactSchema, ChatwootMessage, chatwootMessageSchema, createChatwootContact(), createChatwootConversation(), processChatwootWebhook() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (18): LoginForm(), THEME_CLASSES, ThemeName, ThemeToggle(), createBrowserSupabaseClient(), ResetPasswordPage(), FormControl, FormDescription (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (13): ChatwootClient, ChatwootConfig, ChatwootContact, ChatwootConversation, ChatwootInbox, ChatwootMessage, ChatwootPayload, Avatar (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (14): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): FormState, initialState, Step, TenantWizard(), SignOutButton(), SupabaseClientUser, useSupabaseAuth(), useSupabaseUser() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (13): ContactPayload, POST(), sendEmails(), EmailMessage, emailSchema, sendEcocuponValidatedEmail(), sendEmail(), sendPaymentReminderEmail() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.26
Nodes (10): POST(), createPhoneVerification(), generateCode(), hashCode(), normalizePhone(), sendWahaText(), verifyPhoneCode(), WAHA_BASE_URLS (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): skills, supabase, supabase-postgres-best-practices, computedHash, computedHash, skillPath, source, sourceType (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-next, postcss, tailwindcss, tailwindcss-animate, tsx, @types/node (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (11): ALLOWED_PATHS, fastapiGet(), FastAPIGetSchema, fastapiPost(), FastAPIPostSchema, FastAPIToolNames, isPathAllowed(), ProvisionSchema (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (10): ButtonProps, buttonVariants, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (9): cn(), clsx, HandleProps, PanelGroupProps, PanelProps, ResizableHandle(), ResizablePanel(), ResizablePanelGroup() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

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
Cohesion: 0.25
Nodes (7): sharp, unrs-resolver, name, pnpm, allowedBuilds, private, version

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (8): scripts, approve-builds, build, clean, dev, lint, start, typecheck

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 33 - "Community 33"
Cohesion: 0.38
Nodes (6): config, isProtectedRoute(), isPublicRoute(), middleware(), protectedPrefixes, publicRoutes

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (4): missing, optional, required, snapshot

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (3): DEFAULT_URLS, ServiceResult, Settings

## Knowledge Gaps
- **366 isolated node(s):** `publicRoutes`, `protectedPrefixes`, `config`, `version`, `source` (+361 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 21` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 12`, `Community 14`, `Community 19`, `Community 20`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 32`?**
  _High betweenness centrality (0.301) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 2` to `Community 21`, `Community 30`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 21` to `Community 2`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **What connects `publicRoutes`, `protectedPrefixes`, `config` to the rest of the system?**
  _366 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._