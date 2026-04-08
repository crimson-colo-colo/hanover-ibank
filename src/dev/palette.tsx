/**
 * React Buddy IDE Toolbox Palette Configuration
 *
 * This file defines a structured component palette for React Buddy IDE toolbox,
 * organizing Mantine UI v7 components into logical categories for rapid development.
 */

import {
	// Content Display
	Accordion,
	// Buttons & Actions
	ActionIcon,
	// Misc
	Affix,
	// Feedback & Overlays
	Alert,
	Anchor,
	AngleSlider,
	// Layout & Structure
	AppShell,
	// Media
	AspectRatio,
	// Data Input
	Autocomplete,
	Avatar,
	BackgroundImage,
	Badge,
	Blockquote,
	Box,
	Breadcrumbs,
	Burger,
	Button,
	Card,
	Center,
	Checkbox,
	Chip,
	CloseButton,
	Code,
	Collapse,
	ColorInput,
	ColorPicker,
	ColorSwatch,
	Combobox,
	Container,
	CopyButton,
	Dialog,
	Divider,
	Drawer,
	Fieldset,
	FileButton,
	FileInput,
	Flex,
	FloatingIndicator,
	FloatingWindow,
	FocusTrap,
	Grid,
	Group,
	Highlight,
	HoverCard,
	Image,
	Indicator,
	Input,
	InputBase,
	JsonInput,
	Kbd,
	List,
	Loader,
	LoadingOverlay,
	Mark,
	Marquee,
	Menu,
	Modal,
	ModalBase,
	MultiSelect,
	NativeSelect,
	NavLink,
	Notification,
	NumberFormatter,
	NumberInput,
	OverflowList,
	Overlay,
	Pagination,
	Paper,
	PasswordInput,
	Pill,
	PillsInput,
	PinInput,
	Popover,
	Portal,
	Progress,
	Radio,
	RangeSlider,
	Rating,
	RingProgress,
	ScrollArea,
	Scroller,
	SegmentedControl,
	Select,
	SemiCircleProgress,
	SimpleGrid,
	Skeleton,
	Slider,
	Space,
	Spoiler,
	Stack,
	Stepper,
	Switch,
	Table,
	TableOfContents,
	Tabs,
	TagsInput,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
	Timeline,
	Title,
	Tooltip,
	Transition,
	Tree,
	Typography,
	UnstyledButton,
	VisuallyHidden,
} from "@mantine/core"
import { Category, Component, Palette, Variant } from "@react-buddy/ide-toolbox"
import { useState } from "react"

const noop = () => {
	throw new Error("Function not implemented.")
}

const sampleData = [
	{ value: "react", label: "React" },
	{ value: "vue", label: "Vue" },
	{ value: "angular", label: "Angular" },
]

const elements = [
	{ position: 6, mass: 12.011, symbol: "C", name: "Carbon" },
	{ position: 7, mass: 14.007, symbol: "N", name: "Nitrogen" },
]

export const PaletteTree = () => (
	<Palette>
		<Category name="Demo">
			<Component name="Demo">
				<Variant>
					<Demo />
				</Variant>
			</Component>
		</Category>
		<Category name="Layout & Structure">
			<Component name="AppShell">
				<Variant>
					<AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
						<AppShell.Header>Header</AppShell.Header>
						<AppShell.Navbar>Navbar</AppShell.Navbar>
						<AppShell.Main>Main content</AppShell.Main>
					</AppShell>
				</Variant>
			</Component>

			<Component name="Container">
				<Variant>
					<Container size="md" py="xl">
						Centered content
					</Container>
				</Variant>
				<Variant name="Fluid">
					<Container size="100%" px="md">
						Fluid container
					</Container>
				</Variant>
			</Component>

			<Component name="Flex">
				<Variant>
					<Flex gap="md" justify="center" align="center" direction="row">
						<div>Item 1</div>
						<div>Item 2</div>
					</Flex>
				</Variant>
				<Variant name="Responsive">
					<Flex direction={{ base: "column", sm: "row" }} gap="md">
						<div>Responsive Item</div>
					</Flex>
				</Variant>
			</Component>

			<Component name="Grid">
				<Variant>
					<Grid gap="md">
						<Grid.Col span={6}>Col 1</Grid.Col>
						<Grid.Col span={6}>Col 2</Grid.Col>
					</Grid>
				</Variant>
				<Variant name="Responsive">
					<Grid>
						<Grid.Col span={{ base: 12, md: 6, lg: 3 }}>Responsive col</Grid.Col>
					</Grid>
				</Variant>
			</Component>

			<Component name="Group">
				<Variant>
					<Group gap="md">
						<Button>One</Button>
						<Button>Two</Button>
					</Group>
				</Variant>
				<Variant name="Grow">
					<Group grow>
						<Button>Button</Button>
					</Group>
				</Variant>
			</Component>

			<Component name="SimpleGrid">
				<Variant>
					<SimpleGrid cols={3} spacing="md">
						<div>Item 1</div>
						<div>Item 2</div>
						<div>Item 3</div>
					</SimpleGrid>
				</Variant>
			</Component>

			<Component name="Stack">
				<Variant>
					<Stack gap="md">
						<div>Stacked item 1</div>
						<div>Stacked item 2</div>
					</Stack>
				</Variant>
			</Component>

			<Component name="Space">
				<Variant>
					<Space h="md" />
				</Variant>
				<Variant name="Vertical">
					<Space w="md" />
				</Variant>
			</Component>
		</Category>

		<Category name="Typography & Content">
			<Component name="Text">
				<Variant>
					<Text>Basic text element</Text>
				</Variant>
				<Variant name="Dimmed">
					<Text c="dimmed">Dimmed text</Text>
				</Variant>
				<Variant name="Gradient">
					<Text variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
						Gradient text
					</Text>
				</Variant>
			</Component>

			<Component name="Title">
				<Variant>
					<Title order={1}>Heading 1</Title>
				</Variant>
				<Variant name="H2">
					<Title order={2}>Heading 2</Title>
				</Variant>
			</Component>

			<Component name="Blockquote">
				<Variant>
					<Blockquote cite="— Author">Quote content</Blockquote>
				</Variant>
			</Component>

			<Component name="Code">
				<Variant>
					<Code>Inline code</Code>
				</Variant>
			</Component>

			<Component name="Highlight">
				<Variant>
					<Highlight highlight="highlighted">Text with highlighted content</Highlight>
				</Variant>
			</Component>

			<Component name="List">
				<Variant>
					<List>
						<List.Item>Item 1</List.Item>
						<List.Item>Item 2</List.Item>
					</List>
				</Variant>
			</Component>

			<Component name="Mark">
				<Variant>
					<Mark>Marked text</Mark>
				</Variant>
			</Component>

			<Component name="Typography">
				<Variant>
					<Typography>
						<h1>HTML content</h1>
						<p>Paragraph without link</p>
					</Typography>
				</Variant>
			</Component>
		</Category>

		<Category name="Forms & Inputs">
			<Component name="TextInput">
				<Variant>
					<TextInput label="Label" placeholder="Enter text" />
				</Variant>
				<Variant name="Required">
					<TextInput label="Required Field" placeholder="Enter text" required />
				</Variant>
			</Component>

			<Component name="Textarea">
				<Variant>
					<Textarea label="Description" placeholder="Enter description" />
				</Variant>
				<Variant name="Autosize">
					<Textarea label="Autosize" placeholder="Enter text" autosize minRows={2} maxRows={4} />
				</Variant>
			</Component>

			<Component name="PasswordInput">
				<Variant>
					<PasswordInput label="Password" placeholder="Enter password" />
				</Variant>
			</Component>

			<Component name="JsonInput">
				<Variant>
					<JsonInput label="JSON" placeholder="Enter JSON" />
				</Variant>
			</Component>

			<Component name="Select">
				<Variant>
					<Select label="Choose option" data={sampleData} />
				</Variant>
				<Variant name="Searchable">
					<Select label="Searchable" data={sampleData} searchable />
				</Variant>
				<Variant name="Clearable">
					<Select label="Clearable" data={sampleData} clearable />
				</Variant>
			</Component>

			<Component name="MultiSelect">
				<Variant>
					<MultiSelect label="Select multiple" data={sampleData} />
				</Variant>
			</Component>

			<Component name="Autocomplete">
				<Variant>
					<Autocomplete label="Search" data={["Result 1", "Result 2"]} />
				</Variant>
			</Component>

			<Component name="TagsInput">
				<Variant>
					<TagsInput label="Tags" placeholder="Add tags" />
				</Variant>
			</Component>

			<Component name="NativeSelect">
				<Variant>
					<NativeSelect label="Native select" data={["Option 1", "Option 2"]} />
				</Variant>
			</Component>

			<Component name="SegmentedControl">
				<Variant>
					<SegmentedControl data={["React", "Vue", "Angular"]} />
				</Variant>
			</Component>

			<Component name="NumberInput">
				<Variant>
					<NumberInput label="Number" placeholder="Enter number" />
				</Variant>
				<Variant name="WithLimits">
					<NumberInput label="Number" min={0} max={100} />
				</Variant>
			</Component>

			<Component name="PinInput">
				<Variant>
					<PinInput length={6} type="number" />
				</Variant>
			</Component>

			<Component name="AngleSlider">
				<Variant>
					<AngleSlider />
				</Variant>
			</Component>

			<Component name="Checkbox">
				<Variant>
					<Checkbox label="Checkbox option" />
				</Variant>
				<Variant name="Indeterminate">
					<Checkbox label="Indeterminate" indeterminate />
				</Variant>
			</Component>

			<Component name="Switch">
				<Variant>
					<Switch label="Toggle option" />
				</Variant>
			</Component>

			<Component name="Radio">
				<Variant>
					<Radio label="Radio option" value="1" />
				</Variant>
			</Component>

			<Component name="FileInput">
				<Variant>
					<FileInput label="Upload file" placeholder="Choose file" />
				</Variant>
			</Component>

			<Component name="FileButton">
				<Variant>
					<FileButton onChange={noop}>{(props) => <Button {...props}>Upload</Button>}</FileButton>
				</Variant>
			</Component>

			<Component name="ColorInput">
				<Variant>
					<ColorInput label="Color" />
				</Variant>
			</Component>

			<Component name="ColorPicker">
				<Variant>
					<ColorPicker />
				</Variant>
			</Component>

			<Component name="ColorSwatch">
				<Variant>
					<ColorSwatch color="#228be6" />
				</Variant>
			</Component>

			<Component name="Slider">
				<Variant>
					<Slider label="Value" />
				</Variant>
				<Variant name="Range">
					<RangeSlider label="Range" />
				</Variant>
			</Component>

			<Component name="Rating">
				<Variant>
					<Rating defaultValue={3} />
				</Variant>
			</Component>

			<Component name="Chip">
				<Variant>
					<Chip>Chip label</Chip>
				</Variant>
			</Component>

			<Component name="PillsInput">
				<Variant>
					<PillsInput>
						<Pill>Tag 1</Pill>
						<Pill>Tag 2</Pill>
					</PillsInput>
				</Variant>
			</Component>
		</Category>

		<Category name="Buttons & Actions">
			<Component name="Button">
				<Variant>
					<Button>Primary Button</Button>
				</Variant>
				<Variant name="Variant Outline">
					<Button variant="outline">Outline Button</Button>
				</Variant>
				<Variant name="Variant Light">
					<Button variant="light">Light Button</Button>
				</Variant>
				<Variant name="Variant Filled">
					<Button variant="filled">Filled Button</Button>
				</Variant>
				<Variant name="Variant Subtle">
					<Button variant="subtle">Subtle Button</Button>
				</Variant>
				<Variant name="Variant White">
					<Button variant="white">White Button</Button>
				</Variant>
				<Variant name="Variant Transparent">
					<Button variant="transparent">Transparent Button</Button>
				</Variant>
				<Variant name="Variant Default">
					<Button variant="default">Default Button</Button>
				</Variant>
				<Variant name="Variant Gradient">
					<Button variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
						Gradient Button
					</Button>
				</Variant>
				<Variant name="With Sections">
					<Button leftSection={<span>★</span>} rightSection={<span>→</span>}>
						With Icons
					</Button>
				</Variant>
				<Variant name="Loading">
					<Button loading>Loading</Button>
				</Variant>
				<Variant name="Disabled">
					<Button disabled>Disabled</Button>
				</Variant>
				<Variant name="Full Width">
					<Button fullWidth>Full Width</Button>
				</Variant>
				<Variant name="Compact">
					<Button size="compact-sm">Compact</Button>
				</Variant>
				<Variant name="Group">
					<Button.Group>
						<Button>Left</Button>
						<Button>Middle</Button>
						<Button>Right</Button>
					</Button.Group>
				</Variant>
			</Component>

			<Component name="ActionIcon">
				<Variant>
					<ActionIcon variant="outline">✕</ActionIcon>
				</Variant>
				<Variant name="Variant Subtle">
					<ActionIcon variant="subtle">✕</ActionIcon>
				</Variant>
				<Variant name="Variant Light">
					<ActionIcon variant="light">✕</ActionIcon>
				</Variant>
				<Variant name="Variant Filled">
					<ActionIcon variant="filled">✕</ActionIcon>
				</Variant>
				<Variant name="Variant Default">
					<ActionIcon variant="default">✕</ActionIcon>
				</Variant>
				<Variant name="Variant Transparent">
					<ActionIcon variant="transparent">✕</ActionIcon>
				</Variant>
			</Component>

			<Component name="UnstyledButton">
				<Variant>
					<UnstyledButton>Unstyled button</UnstyledButton>
				</Variant>
			</Component>

			<Component name="CloseButton">
				<Variant>
					<CloseButton />
				</Variant>
			</Component>

			<Component name="CopyButton">
				<Variant>
					<CopyButton value="Copied text">
						{({ copied, copy }) => (
							<Button color={copied ? "cyan" : "blue"} onClick={copy}>
								{copied ? "Copied" : "Copy"}
							</Button>
						)}
					</CopyButton>
				</Variant>
			</Component>

			<Component name="Burger">
				<Variant>
					<Burger opened={false} onClick={noop} />
				</Variant>
			</Component>

			<Component name="Pagination">
				<Variant>
					<Pagination total={10} />
				</Variant>
			</Component>

			<Component name="Stepper">
				<Variant>
					<Stepper active={0}>
						<Stepper.Step label="Step 1" description="Description" />
						<Stepper.Step label="Step 2" description="Description" />
					</Stepper>
				</Variant>
			</Component>
		</Category>

		<Category name="Data Display">
			<Component name="Table">
				<Variant>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Header</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>Cell</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Variant>
				<Variant name="Striped">
					<Table striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Element</Table.Th>
								<Table.Th>Symbol</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{elements.map((e) => (
								<Table.Tr key={e.name}>
									<Table.Td>{e.name}</Table.Td>
									<Table.Td>{e.symbol}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Variant>
				<Variant name="Data Prop">
					<Table
						data={{
							head: ["Name", "Symbol"],
							body: elements.map((e) => [e.name, e.symbol]),
						}}
					/>
				</Variant>
			</Component>

			<Component name="Tree">
				<Variant>
					<Tree
						data={[
							{
								label: "Node 1",
								value: "1",
								children: [{ label: "Child", value: "1-1" }],
							},
						]}
					/>
				</Variant>
			</Component>

			<Component name="Accordion">
				<Variant>
					<Accordion>
						<Accordion.Item value="item1">
							<Accordion.Control>Section 1</Accordion.Control>
							<Accordion.Panel>Content 1</Accordion.Panel>
						</Accordion.Item>
					</Accordion>
				</Variant>
			</Component>

			<Component name="Tabs">
				<Variant>
					<Tabs defaultValue="tab1">
						<Tabs.List>
							<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
							<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel value="tab1">Panel 1</Tabs.Panel>
						<Tabs.Panel value="tab2">Panel 2</Tabs.Panel>
					</Tabs>
				</Variant>
				<Variant name="Vertical">
					<Tabs defaultValue="tab1" orientation="vertical">
						<Tabs.List>
							<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
							<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel value="tab1">Panel 1</Tabs.Panel>
						<Tabs.Panel value="tab2">Panel 2</Tabs.Panel>
					</Tabs>
				</Variant>
			</Component>

			<Component name="Timeline">
				<Variant>
					<Timeline active={1} bulletSize={24} lineWidth={2}>
						<Timeline.Item bullet={1} title="Order placed">
							<Text c="dimmed" size="sm">
								Order #123
							</Text>
						</Timeline.Item>
					</Timeline>
				</Variant>
			</Component>

			<Component name="Breadcrumbs">
				<Variant>
					<Breadcrumbs>Home / Products / Item</Breadcrumbs>
				</Variant>
			</Component>

			<Component name="Spoiler">
				<Variant>
					<Spoiler maxHeight={60} showLabel="Show more" hideLabel="Hide">
						Long content that can be collapsed...
					</Spoiler>
				</Variant>
			</Component>

			<Component name="Collapse">
				<Variant>
					<Collapse expanded={true}>Collapsible content</Collapse>
				</Variant>
				<Variant name="Horizontal">
					<Collapse expanded={true} orientation="horizontal">
						Horizontal content
					</Collapse>
				</Variant>
			</Component>

			<Component name="TableOfContents">
				<Variant>
					<TableOfContents />
				</Variant>
			</Component>

			<Component name="OverflowList">
				<Variant>
					<OverflowList
						data={["Item 1", "Item 2", "Item 3"]}
						renderItem={(item) => <span>{item}</span>}
						renderOverflow={(items) => <span>+{items.length} more</span>}
					/>
				</Variant>
			</Component>
		</Category>

		<Category name="Feedback & Overlays">
			<Component name="Alert">
				<Variant>
					<Alert title="Alert Title" icon={<span>⚠️</span>}>
						Alert message
					</Alert>
				</Variant>
				<Variant name="Variants">
					<Alert variant="light" color="blue">
						Light variant
					</Alert>
				</Variant>
			</Component>

			<Component name="Notification">
				<Variant>
					<Notification title="Success!" icon={<span>✓</span>} color="cyan">
						Operation completed successfully
					</Notification>
				</Variant>
			</Component>

			<Component name="Modal">
				<Variant>
					<Modal opened={false} onClose={noop} title="Modal Title">
						Modal content
					</Modal>
				</Variant>
				<Variant name="Size Auto">
					<Modal opened={false} onClose={noop} size="auto">
						Auto-sized content
					</Modal>
				</Variant>
				<Variant name="Full Screen">
					<Modal opened={false} onClose={noop} fullScreen>
						Fullscreen content
					</Modal>
				</Variant>
			</Component>

			<Component name="Drawer">
				<Variant>
					<Drawer opened={false} onClose={noop} title="Drawer">
						Drawer content
					</Drawer>
				</Variant>
				<Variant name="Right">
					<Drawer opened={false} onClose={noop} position="right">
						Right drawer
					</Drawer>
				</Variant>
			</Component>

			<Component name="Dialog">
				<Variant>
					<Dialog opened={false}>Dialog content</Dialog>
				</Variant>
			</Component>

			<Component name="Tooltip">
				<Variant>
					<Tooltip label="Tooltip text">
						<Button>Hover me</Button>
					</Tooltip>
				</Variant>
				<Variant name="Multiline">
					<Tooltip label="Line 1\nLine 2" multiline>
						<Button>Multiline</Button>
					</Tooltip>
				</Variant>
			</Component>

			<Component name="Popover">
				<Variant>
					<Popover>
						<Popover.Target>
							<Button>Click me</Button>
						</Popover.Target>
						<Popover.Dropdown>Popover content</Popover.Dropdown>
					</Popover>
				</Variant>
			</Component>

			<Component name="HoverCard">
				<Variant>
					<HoverCard>
						<HoverCard.Target>
							<Button>Hover target</Button>
						</HoverCard.Target>
						<HoverCard.Dropdown>Card content</HoverCard.Dropdown>
					</HoverCard>
				</Variant>
			</Component>

			<Component name="Menu">
				<Variant>
					<Menu>
						<Menu.Target>
							<Button>Menu</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item>Item 1</Menu.Item>
							<Menu.Item>Item 2</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Variant>
			</Component>

			<Component name="LoadingOverlay">
				<Variant>
					<LoadingOverlay visible={false} />
				</Variant>
			</Component>

			<Component name="Overlay">
				<Variant>
					<Overlay />
				</Variant>
			</Component>

			<Component name="Skeleton">
				<Variant>
					<Skeleton height={50} />
				</Variant>
				<Variant name="Circle">
					<Skeleton height={50} circle />
				</Variant>
			</Component>
		</Category>

		<Category name="Media & Visual">
			<Component name="Image">
				<Variant>
					<Image src="https://via.placeholder.com/400" alt="Placeholder" />
				</Variant>
				<Variant name="With Placeholder">
					<Image
						src="https://via.placeholder.com/400"
						alt="Placeholder"
						fallbackSrc="https://via.placeholder.com/400?text=Error"
					/>
				</Variant>
			</Component>

			<Component name="BackgroundImage">
				<Variant>
					<BackgroundImage src="https://via.placeholder.com/800">
						<div style={{ minHeight: 200 }}>Content over image</div>
					</BackgroundImage>
				</Variant>
			</Component>

			<Component name="AspectRatio">
				<Variant>
					<AspectRatio ratio={16 / 9}>
						<div>16:9 content</div>
					</AspectRatio>
				</Variant>
			</Component>

			<Component name="Progress">
				<Variant>
					<Progress value={50} />
				</Variant>
				<Variant name="Striped">
					<Progress value={50} striped />
				</Variant>
				<Variant name="Animated">
					<Progress value={50} striped animated={true} />
				</Variant>
			</Component>

			<Component name="RingProgress">
				<Variant>
					<RingProgress sections={[{ value: 40, color: "cyan" }]} label={<Text>40%</Text>} />
				</Variant>
			</Component>

			<Component name="SemiCircleProgress">
				<Variant>
					<SemiCircleProgress value={75} label="75%" />
				</Variant>
			</Component>

			<Component name="Loader">
				<Variant>
					<Loader />
				</Variant>
				<Variant name="Type">
					<Loader type="dots" />
				</Variant>
				<Variant name="Type Bars">
					<Loader type="bars" />
				</Variant>
				<Variant name="Type Oval">
					<Loader type="oval" />
				</Variant>
			</Component>

			<Component name="Marquee">
				<Variant>
					<Marquee>Scrolling text content</Marquee>
				</Variant>
			</Component>

			<Component name="FloatingIndicator">
				<Variant>
					<FloatingIndicator target={undefined} parent={undefined} />
				</Variant>
			</Component>

			<Component name="FloatingWindow">
				<Variant>
					<FloatingWindow>Window content</FloatingWindow>
				</Variant>
			</Component>

			<Component name="Scroller">
				<Variant>
					<Scroller>Scrollable content</Scroller>
				</Variant>
			</Component>
		</Category>

		<Category name="Cards & Surfaces">
			<Component name="Card">
				<Variant>
					<Card shadow="sm" padding="lg" radius="md" withBorder>
						<Card.Section>
							<Image src="https://via.placeholder.com/400" height={160} />
						</Card.Section>
						<Text fw={500} mt="md">
							Card Title
						</Text>
						<Text size="sm" c="dimmed">
							Card description
						</Text>
					</Card>
				</Variant>
				<Variant name="With Section Border">
					<Card padding="xl" radius="md" withBorder>
						<Card.Section withBorder inheritPadding py="xs">
							Section with border
						</Card.Section>
						<Text>Content</Text>
					</Card>
				</Variant>
			</Component>

			<Component name="Paper">
				<Variant>
					<Paper shadow="xs" p="md">
						Paper content
					</Paper>
				</Variant>
			</Component>

			<Component name="Fieldset">
				<Variant>
					<Fieldset legend="Fieldset title">Fieldset content</Fieldset>
				</Variant>
			</Component>

			<Component name="Center">
				<Variant>
					<Center h={100}>Centered content</Center>
				</Variant>
			</Component>

			<Component name="ScrollArea">
				<Variant>
					<ScrollArea h={200}>Scrollable content goes here...</ScrollArea>
				</Variant>
			</Component>
		</Category>

		<Category name="Badges & Labels">
			<Component name="Badge">
				<Variant>
					<Badge>New</Badge>
				</Variant>
				<Variant name="Dot">
					<Badge leftSection={<span>●</span>} color="emerald">
						Online
					</Badge>
				</Variant>
				<Variant name="Gradient">
					<Badge variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
						Gradient
					</Badge>
				</Variant>
			</Component>

			<Component name="Indicator">
				<Variant>
					<Indicator inline label="New" size={16}>
						<Avatar size="lg" />
					</Indicator>
				</Variant>
				<Variant name="Dot">
					<Indicator>
						<Avatar size="lg" />
					</Indicator>
				</Variant>
			</Component>

			<Component name="Pill">
				<Variant>
					<Pill>Pill label</Pill>
				</Variant>
				<Variant name="With Remove">
					<Pill withRemoveButton>Pill</Pill>
				</Variant>
			</Component>

			<Component name="Kbd">
				<Variant>
					<Kbd>⌘ + K</Kbd>
				</Variant>
			</Component>

			<Component name="ThemeIcon">
				<Variant>
					<ThemeIcon variant="filled">
						<span>★</span>
					</ThemeIcon>
				</Variant>
				<Variant name="Variant Light">
					<ThemeIcon variant="light">★</ThemeIcon>
				</Variant>
				<Variant name="Variant Outline">
					<ThemeIcon variant="outline">★</ThemeIcon>
				</Variant>
				<Variant name="Variant Default">
					<ThemeIcon variant="default">★</ThemeIcon>
				</Variant>
			</Component>
		</Category>

		<Category name="Navigation">
			<Component name="Anchor">
				<Variant>
					<Anchor href="#">Link text</Anchor>
				</Variant>
			</Component>

			<Component name="NavLink">
				<Variant>
					<NavLink label="Navigation item" />
				</Variant>
				<Variant name="Active">
					<NavLink label="Active item" active />
				</Variant>
			</Component>

			<Component name="Breadcrumbs">
				<Variant>
					<Breadcrumbs>
						{/** biome-ignore lint/a11y/useValidAnchor: Example code */}
						<a href="#">Home</a>
						{/** biome-ignore lint/a11y/useValidAnchor: Example code */}
						<a href="#">Library</a>
						<span>Data</span>
					</Breadcrumbs>
				</Variant>
			</Component>
		</Category>

		<Category name="Avatar & User">
			<Component name="Avatar">
				<Variant>
					<Avatar src="https://via.placeholder.com/100" alt="User" />
				</Variant>
				<Variant name="Letters">
					<Avatar color="cyan" radius="xl">
						JD
					</Avatar>
				</Variant>
				<Variant name="Placeholder">
					<Avatar color="blue">JD</Avatar>
				</Variant>
			</Component>

			<Component name="Avatar Group">
				<Variant>
					<Avatar.Group spacing="sm">
						<Avatar src="https://via.placeholder.com/100" />
						<Avatar src="https://via.placeholder.com/100" />
						<Avatar>+5</Avatar>
					</Avatar.Group>
				</Variant>
			</Component>
		</Category>

		<Category name="Utilities & Misc">
			<Component name="Affix">
				<Variant>
					<Affix position={{ bottom: 20, right: 20 }}>
						<Button>Fixed Button</Button>
					</Affix>
				</Variant>
			</Component>

			<Component name="Divider">
				<Variant>
					<Divider my="sm" />
				</Variant>
				<Variant name="Label">
					<Divider label="Label" labelPosition="center" />
				</Variant>
			</Component>

			<Component name="FocusTrap">
				<Variant>
					<FocusTrap active>
						<div>Trapped focus content</div>
					</FocusTrap>
				</Variant>
			</Component>

			<Component name="Portal">
				<Variant>
					<Portal>Portalled content</Portal>
				</Variant>
			</Component>

			<Component name="NumberFormatter">
				<Variant>
					<NumberFormatter value={1234567.89} thousandSeparator />
				</Variant>
				<Variant name="Prefix">
					<NumberFormatter value={1234} prefix="$" />
				</Variant>
			</Component>

			<Component name="VisuallyHidden">
				<Variant>
					<VisuallyHidden>Screen reader only text</VisuallyHidden>
				</Variant>
			</Component>

			<Component name="Combobox">
				<Variant>
					<Combobox>
						<Combobox.Target>
							<InputBase component="button">Select</InputBase>
						</Combobox.Target>
						<Combobox.Dropdown>
							<Combobox.Options>
								<Combobox.Option value="1">Option 1</Combobox.Option>
							</Combobox.Options>
						</Combobox.Dropdown>
					</Combobox>
				</Variant>
			</Component>

			<Component name="InputBase">
				<Variant>
					<InputBase component="button">Input base</InputBase>
				</Variant>
			</Component>

			<Component name="Input">
				<Variant>
					<Input placeholder="Basic input" />
				</Variant>
			</Component>
		</Category>

		<Category name="Animations">
			<Component name="Transition">
				<Variant>
					<Transition mounted={true} transition="fade" duration={400} timingFunction="ease">
						{(styles) => <div style={styles}>Fading content</div>}
					</Transition>
				</Variant>
				<Variant name="Slide Up">
					<Transition mounted={true} transition="slide-up">
						{(styles) => <div style={styles}>Sliding content</div>}
					</Transition>
				</Variant>
			</Component>
		</Category>

		<Category name="Base Components">
			<Component name="ModalBase">
				<Variant>
					<ModalBase opened={false} onClose={noop}>
						Base modal content
					</ModalBase>
				</Variant>
			</Component>

			<Component name="Box">
				<Variant>
					<Box p="md" bg="gray.1">
						Box content
					</Box>
				</Variant>
			</Component>
		</Category>
	</Palette>
)

function Demo() {
	const [active, setActive] = useState(1)
	const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current))
	const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

	return (
		<>
			<Stepper active={active} onStepClick={setActive}>
				<Stepper.Step label="First step" description="Create an account">
					Step 1 content: Create an account
				</Stepper.Step>
				<Stepper.Step label="Second step" description="Verify email">
					Step 2 content: Verify email
				</Stepper.Step>
				<Stepper.Step label="Final step" description="Get full access">
					Step 3 content: Get full access
				</Stepper.Step>
				<Stepper.Completed>Completed, click back button to get to previous step</Stepper.Completed>
			</Stepper>

			<Group justify="center" mt="xl">
				<Button variant="default" onClick={prevStep}>
					Back
				</Button>
				<Button onClick={nextStep}>Next step</Button>
			</Group>
		</>
	)
}

export default PaletteTree
