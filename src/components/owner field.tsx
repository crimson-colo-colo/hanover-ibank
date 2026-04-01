import type {ReactNode} from 'react';

export function ownerField(): ReactNode{
    return(
        <>
            <label htmlFor="owner">Document Owner: </label>
            <input type="text" id="owner" name="owner"/><br/>
        </>
    );
}