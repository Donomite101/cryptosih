import re
from typing import Dict, Any, Optional
from Crypto.Hash import keccak

# Common known ENS shortcuts
KNOWN_NAMES = {
    "vitalik.eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    "binance.eth": "0x28c6c06298d514db089934071355e5743bf21d60",
    "coinbase.eth": "0x503828976d22510aad0201ac7ec88293211d23dc"
}

def is_valid_eth_address(address: str) -> bool:
    """Checks if a string is a valid Ethereum 40-hex address."""
    clean = address.strip()
    return bool(re.match(r"^0x[a-fA-F0-9]{40}$", clean))

def pubkey_to_eth_address(pubkey_hex: str) -> str:
    """
    Derives an Ethereum address from an ECDSA secp256k1 public key.
    Supports uncompressed (64 or 65 bytes) and compressed public keys.
    Formula: address = 0x + keccak256(uncompressed_pubkey)[12:]
    """
    clean = pubkey_hex.strip().lower()
    if clean.startswith("0x"):
        clean = clean[2:]

    # If uncompressed 65 bytes (130 hex chars) with '04' prefix
    if len(clean) == 130 and clean.startswith("04"):
        raw_pub = bytes.fromhex(clean[2:])
    elif len(clean) == 128: # Raw 64 bytes (X and Y coordinates)
        raw_pub = bytes.fromhex(clean)
    elif len(clean) == 66 and (clean.startswith("02") or clean.startswith("03")):
        # Compressed 33 bytes
        try:
            from Crypto.PublicKey import ECC
            point = ECC.import_key(bytes.fromhex(clean))
            raw_pub = point.pointQ.x.to_bytes(32) + point.pointQ.y.to_bytes(32)
        except Exception:
            raw_pub = bytes.fromhex(clean)
    elif len(clean) == 64:
        # Raw 32 bytes or X-coordinate
        raw_pub = bytes.fromhex(clean)
    else:
        raise ValueError(f"Invalid public key length ({len(clean)} hex characters). Expected 64, 66, 128, or 130 hex characters.")

    k = keccak.new(digest_bits=256)
    k.update(raw_pub)
    digest = k.hexdigest()
    eth_addr = "0x" + digest[24:]
    return eth_addr.lower()

def resolve_crypto_identifier(identifier: str) -> Dict[str, Any]:
    """
    Parses user input:
    - If known ENS name (vitalik.eth), resolves address.
    - If valid Ethereum address, returns address directly.
    - If 40 hex chars without 0x, prepends 0x.
    - If cryptographic public key (64, 66, 128, 130 hex chars), derives the Ethereum address via Keccak-256.
    """
    if not identifier:
        raise ValueError("Please enter a wallet address or cryptographic public key.")

    cleaned = identifier.strip().strip('"').strip("'").strip()

    # 0. Pasted text containing an address (e.g. "Target: 0xabc...") -> pull the address out
    if re.search(r"\s", cleaned) or (len(cleaned) > 66 and not re.fullmatch(r"(0x)?[0-9a-fA-F]+", cleaned)):
        m = re.search(r"(?<![0-9a-zA-Z])0x[a-fA-F0-9]{40}(?![0-9a-zA-Z])", cleaned)
        if not m:
            m = re.search(r"(?<![0-9a-zA-Z])T[1-9A-HJ-NP-Za-km-z]{33}(?![0-9a-zA-Z])", cleaned)
        if m:
            cleaned = m.group(0)

    # 0b. Transaction hash (0x + 64 hex): the victim's payment ID. Engine looks up who received it.
    if re.fullmatch(r"0x[a-fA-F0-9]{64}", cleaned):
        return {
            "input_type": "TX_HASH",
            "derived_address": None,
            "original_input": cleaned,
            "tx_hash": cleaned.lower(),
            "public_key": None
        }

    # 1. Check known ENS names
    if cleaned.lower() in KNOWN_NAMES:
        return {
            "input_type": "ENS_NAME",
            "derived_address": KNOWN_NAMES[cleaned.lower()],
            "original_input": cleaned,
            "public_key": None
        }

    # 1b. Tron base58 address (T...) - case-sensitive, kept as-is
    if re.match(r"^T[1-9A-HJ-NP-Za-km-z]{33}$", cleaned):
        return {
            "input_type": "TRON_ADDRESS",
            "derived_address": cleaned,
            "original_input": cleaned,
            "public_key": None
        }

    # 2. Check standard 0x address
    if is_valid_eth_address(cleaned):
        return {
            "input_type": "ETHEREUM_ADDRESS",
            "derived_address": cleaned.lower(),
            "original_input": cleaned,
            "public_key": None
        }

    # 3. Check 40 hex chars without 0x
    if len(cleaned) == 40 and all(c in "0123456789abcdefABCDEF" for c in cleaned):
        return {
            "input_type": "ETHEREUM_ADDRESS",
            "derived_address": ("0x" + cleaned).lower(),
            "original_input": cleaned,
            "public_key": None
        }

    # 4. Check Public Key format (64, 66, 128, or 130 hex characters)
    hex_only = cleaned.lower().replace("0x", "")
    if len(hex_only) in [64, 66, 128, 130] and all(c in "0123456789abcdef" for c in hex_only):
        try:
            derived = pubkey_to_eth_address(cleaned)
            return {
                "input_type": "CRYPTOGRAPHIC_PUBLIC_KEY",
                "derived_address": derived.lower(),
                "original_input": cleaned,
                "public_key": cleaned
            }
        except Exception as e:
            raise ValueError(f"Could not derive address from public key: {e}")

    # 5. Check if it's an Ethereum address with mixed casing or prefix issues
    if cleaned.lower().startswith("0x") and len(cleaned) == 42 and all(c in "0123456789abcdef" for c in cleaned[2:].lower()):
        return {
            "input_type": "ETHEREUM_ADDRESS",
            "derived_address": cleaned.lower(),
            "original_input": cleaned,
            "public_key": None
        }

    shown = cleaned if len(cleaned) <= 40 else cleaned[:37] + "..."
    raise ValueError(
        f"'{shown}' is not a wallet address. Paste the suspect's wallet address "
        "(starts with 0x and is 42 characters, or starts with T for Tron), a transaction ID (0x + 64 characters), or a public key."
    )
