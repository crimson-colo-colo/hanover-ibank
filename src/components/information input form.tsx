import type {ReactNode} from "react";

export function inputForm(): ReactNode{
    return(
        <>
        <form>
            <p>What is your role? </p>
            <label htmlFor="role">Role:</label>
            <select name="role" id="role">
                <option value="Underwriter"> Underwriter</option>
                <option value="Business Analyst"> Business Analyst</option>
            </select>
            <br/>

            <label htmlFor="fname">First Name: </label>
            <input type="text" id="fname" name="fname"/><br/>

            <label htmlFor="lname">Last Name: </label>
            <input type="text" id="lname" name="lname"/><br/>

            <label htmlFor="email">Email Address: </label>
            <input type="text" id="email" name="email"/><br/>
        </form>
        </>
    );
}