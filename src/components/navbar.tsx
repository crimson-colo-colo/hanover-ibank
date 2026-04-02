import { useState } from 'react';
import { Button, Burger, Container, Divider, Drawer, Group, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const links = [
    { link: '/about', label: 'Features' },
    { link: '/pricing', label: 'Pricing' },
    { link: '/learn', label: 'Learn' },
    { link: '/community', label: 'Community' },
];

export function HeaderSimple() {
    return (
        <header>
            <Button>Hello</Button>
        </header>
    );
}
export default HeaderSimple