export function Field() {
    return (
        <div>
            <div onChange={change}>
                <input type="radio" value="Rock" name="gender" /> Male
                <input type="radio" value="Paper" name="gender" /> Female
                <input type="radio" value="Scissors" name="gender" /> Other
            </div>
            <div>
                <button onClick={click}>Play</button>
            </div>
        </div>
    );
}

function click() {
    console.log("hello")
}

function change() {
    console.log(el)
}