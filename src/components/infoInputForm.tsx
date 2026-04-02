import type {ReactNode} from "react";
import {TextInput, Select} from "@mantine/core";

export function infoInputForm(): ReactNode{
    return(
        <>
        <form>
            <p>What is your role? </p>
            <label htmlFor="role">Role:</label>
            <Select
                label="What is Your Role?"
                placeholder="Pick One"
                data={['Underwriter', 'Business Analyst']}
            />
            <br/>

            <label htmlFor="fname">First Name: </label>
            <TextInput
                label="First Name"
                placeholder="Input Name"
            />
            <br/>

            <label htmlFor="lname">Last Name: </label>
            <TextInput
                label="Input Name"
                placeholder="Input Name"
            />
            <br/>

            <label htmlFor="email">Email Address: </label>
            <TextInput
                label="Input Email Adress"
                placeholder="Input Email Adress"
            />
            <br/>
        </form>
        </>
    );
}