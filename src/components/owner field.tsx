import type {ReactNode} from 'react';
import {TextInput} from '@mantine/core';

export function ownerField(): ReactNode{
    return(
        <>
            <TextInput
                label="Input Document Owner"
                placeholder={"Enter Name of Document Owner"}
            />
        </>
    );
}