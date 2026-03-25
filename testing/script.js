const btnCloseMenu = document.querySelector(".close-menu");
const btnOpenMenu = document.querySelector(".side-btn");
const menu = document.querySelector(".menu");
const modalsContainer = document.querySelector(".modals");

// Menu Logic
btnCloseMenu?.addEventListener("click", (e) => {
    e.preventDefault();
    menu.classList.add("hidden");
});

btnOpenMenu?.addEventListener("click", (e) => {
    e.preventDefault();
    menu.classList.remove("hidden");
});

class Form {
    #parentElement;
    #openFormButtonMarkup;
    #openFormButtonClass;
    #openFormButton;
    #APIUrl;
    #emptyParams;
    #headers;

    constructor(inputFieldMarkup, openFormButtonName, openFormButtonClass, apiUrl, emptyParams, emptyHeaders, modalClass) {
        this.modalClass = modalClass;
        this.inputFieldMarkup = inputFieldMarkup;
        this.#APIUrl = apiUrl;
        this.#emptyParams = emptyParams;
        this.#headers = emptyHeaders;
        this.#openFormButtonClass = openFormButtonClass;
        // Added btn-contact and the specific class
        this.#openFormButtonMarkup = `<button class="btn-contact ${this.#openFormButtonClass}">${openFormButtonName}</button>`;
        
        this.render();
    }

    render() {
        // 1. Generate and Inject Modal
        const modalMarkup = `
            <div class="modal ${this.modalClass} hidden">
                <form class="modal-form">
                    ${this.inputFieldMarkup}
                    <div class="form-btn-container">
                        <button type="submit" class="form-btn form-submit">Submit</button>
                        <button type="button" class="form-btn form-cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        modalsContainer.insertAdjacentHTML('beforeend', modalMarkup);
        
        // 2. Select the specific element using dot notation
        this.#parentElement = modalsContainer.querySelector(`.${this.modalClass}`);

        // 3. Inject and Select Open Button
        menu.insertAdjacentHTML('beforeend', this.#openFormButtonMarkup);
        this.#openFormButton = menu.querySelector(`.${this.#openFormButtonClass}`);
        this.formInputs = this.#parentElement.querySelectorAll('[name="form-input"]')
        console.log(this.formInputs)
        // 4. Init Listeners
        this.listenForFormClosing();
        this.listenForFormDisplaying();
        this.listenForFormSubmission();
    }

    show() {
        this.#parentElement.classList.remove("hidden");
        this.formInputs[0].focus();
    }

    hide() {
        const inputs = this.#parentElement.querySelectorAll('input')
        Array.from(inputs).forEach(input => {
            input.value = ''
        })
        this.#parentElement.classList.add("hidden");
    }

    listenForFormSubmission() {
        // Use Arrow functions to keep 'this' pointing to the Class Instance
        this.#parentElement.querySelector('.form-submit').addEventListener("click", (e) => {
            e.preventDefault();
            this.getDataAndMakeRequest();
        });

        this.#parentElement.addEventListener('keydown', (e) => {
            if (this.#parentElement.classList.contains('hidden')) return;
            // Check if the pressed key is "Enter" (key code 13)
            if (e.key === "Enter" || e.keyCode === 13) {
                // Prevent the default action (form submission)
                e.preventDefault();

                // Get the current focused element
                const currentInput = document.activeElement;

                // Find the index of the current input in the list of all inputs
                const currentIndex = Array.from(this.formInputs).indexOf(currentInput);

                // If there is a next input field, focus it
                if (currentIndex > -1 && currentIndex < this.formInputs.length - 1) {
                    this.formInputs[currentIndex + 1].focus();
                } else {
                    this.getDataAndMakeRequest();
                }
            }
        });
    }

    listenForFormClosing() {
        this.#parentElement.querySelector(".form-cancel").addEventListener("click", (e) => {
            e.preventDefault();
            this.hide();
        });
    }

    listenForFormDisplaying() {
        this.#openFormButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.show();
        });
    }

    async getDataAndMakeRequest() {
        // Correctly extract values from inputs inside THIS modal only
        const inputs = [...this.#parentElement.querySelectorAll("input"), ...this.#parentElement.querySelectorAll("textarea")];
        const data = Array.from(inputs).map(input => input.value);

        if (data.some(val => !val)) {
            const errorAlertStringData = data.reduce((acc, val, i) => {
                if (!val) {
                    const inputName = inputs[i]?.previousElementSibling?.textContent
                    return [...acc, String(inputName)]
                } else {
                    return acc
                }
            }, [])

            alert(`Please provide: ${errorAlertStringData.join(', ')}`)

            return;
        }

        try {
            await this.makeAPIRequest(data);
            console.log("Success!");
            this.hide();
        } catch (err) {
            console.error("API Request Failed:", err);
            throw err;
        }

        inputs.forEach(input => input.textContent = "")
    }

    async makeAPIRequest(data) {
        const parameters = Object.fromEntries(this.#emptyParams.map((el, i) => {
            return [el, data[i]]
        }));      
            
        fetch(this.#APIUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.#headers
            },
            body: JSON.stringify({
                ...parameters,
                payload: data
            }),
        });
    }
}

// Fixed the trailing quote syntax error in the markup string
const email_form = new Form(
    `<p>E-mail</p>
    <input name="form-input" type="email" placeholder="me@example.com">
    <p>Subject</p>
    <input name="form-input" type="text">
    <p>First Name</p>
    <input name="form-input" type="text">
    <p>Last Name</p>
    <input name="form-input" type="text">
    <p>Phone</p>
    <input name="form-input" type="text" placeholder="123-456-7890">
    <p>Body</p>
    <textarea name="form-input" type="text" class="increased-height"></textarea>`, 
    'Email',
    'btn-email',
    'https://hooks.us.webexconnect.io/events/K22XV81ZQU', // Testing URL
    ['customerEmail', 'emailSubject', 'fname', 'lname', 'phone', 'message'],
    {},
    "modal-email"
);
