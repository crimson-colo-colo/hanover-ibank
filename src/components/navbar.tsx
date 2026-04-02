import { useState } from 'react';
import { Burger, Container, Divider, Drawer, Group, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import './navbar.css'

const links = [
    { link: '/', label: 'Home' },
    { link: '/form', label: 'Form' },
    { link: '/overwriter', label: 'Overwriter' },
    { link: '/analyst', label: 'Business Analyst' },
    { link: '/users', label: 'Users' },
];

export function HeaderSimple() {
    const [opened, { toggle, close }] = useDisclosure(false);
    const [active, setActive] = useState(links[0].link);

    const items = links.map((link) => (
        <a
            key={link.label}
            href={link.link}
            className={"link"}
            // @ts-ignore
            data-active={active === link || undefined}
            onClick={(event) => {
                event.preventDefault();
                setActive(link.link);
            }}
        >
            {link.label}
        </a>
    ));

    return (
        <header className={"header"}>
            <Container size="md" className={"inner"}>
                <Group gap={5} visibleFrom="xs">
                    {items}
                </Group>

                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="xs"
                    size="sm"
                    aria-label="Toggle navigation"
                />
            </Container>

            <Drawer
                opened={opened}
                onClose={close}
                size="100%"
                padding="md"
                title="Navigation"
                hiddenFrom="xs"
                zIndex={1000000}
            >
                <ScrollArea h="calc(100vh - 80px" mx="-md">
                    <Divider my="sm" />
                    {items}
                </ScrollArea>
            </Drawer>
        </header>
    );
}
export default HeaderSimple