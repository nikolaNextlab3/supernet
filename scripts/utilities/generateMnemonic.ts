import { Mnemonic } from "../../juneoJS";     // Using juneoJS library

// Function used to generate a mnemonic phrase
const generateMnemonic = async () : Promise<any> => {
    const mnemonic: Mnemonic = Mnemonic.getInstance();                          // Initializing mnemonic object
    const strength: number = 256;                                               // Defining mnemonic strength (bit lenght)
    const wordlist: string[] = mnemonic.getWordlists("english") as string[];    // Defining language for mnemonic generation
    
    const randomBytes = undefined; // Optional random bytes (left at undefiend by default)
    
    const mnemonicPhrase: string = mnemonic.generateMnemonic(strength, randomBytes, wordlist);      // Generating mnemonic phrase string

    console.log(`
    Mnemonic phrase:
    ${mnemonicPhrase}
    `);    
};

generateMnemonic()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
});