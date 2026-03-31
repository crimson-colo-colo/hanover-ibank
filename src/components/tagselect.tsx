function TagSelector() {
    return (
        <div>
            <label htmlFor="tagselect">Is this document reference material or workflow material?</label>
            <select id="tagselect" name="options">
                <option value="1">Reference Material</option>
                <option value="2">Workflow Material</option>
            </select>
        </div>
    )
}