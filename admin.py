import pymongo
import random
import string
import sys
from datetime import datetime

MONGO_URI = "mongodb+srv://noxthedevwindev_db_user:w5VCRS8wu73rfUNB@cluster0.c5b4s3c.mongodb.net"
DB_NAME = "gamestop_online"

def connect_db():
    client = pymongo.MongoClient(MONGO_URI)
    return client[DB_NAME]

def generate_code():
    return ''.join(random.choices(string.digits, k=6))

def create_profile(db):
    name = input("Enter profile name: ").strip()
    if not name:
        print("Name cannot be empty.")
        return

    code = generate_code()
    while db.profiles.find_one({"code": code}):
        code = generate_code()

    profile = {
        "code": code,
        "name": name,
        "avatar": "",
        "games": [],
        "ip": None,
        "settings": {"ipLock": False, "showOnLogin": True, "theme": "dark"},
        "bio": {"age": "", "favGame": "", "discord": ""},
        "createdAt": datetime.utcnow()
    }

    db.profiles.insert_one(profile)
    print(f"\nProfile created!")
    print(f"  Name: {name}")
    print(f"  Code: {code}")
    print(f"\nGive this code to the user.")

def list_profiles(db):
    profiles = list(db.profiles.find())
    if not profiles:
        print("\nNo profiles found.")
        return

    print(f"\n{'#':<4} {'Code':<8} {'Name':<20} {'Games':<8}")
    print("-" * 45)
    for i, p in enumerate(profiles):
        print(f"{i+1:<4} {p['code']:<8} {p['name']:<20} {len(p.get('games', [])):<8}")
    print()

def manage_profile(db):
    list_profiles(db)
    profiles = list(db.profiles.find())
    if not profiles:
        return

    choice = input("Enter profile number to manage (or 'cancel'): ").strip()
    if choice == 'cancel':
        return

    try:
        idx = int(choice) - 1
        if idx < 0 or idx >= len(profiles):
            print("Invalid selection.")
            return
    except ValueError:
        print("Invalid input.")
        return

    profile = profiles[idx]
    code = profile['code']

    while True:
        print(f"\n{'=' * 40}")
        print(f"  Managing: {profile['name']} ({code})")
        print(f"{'=' * 40}")
        games = profile.get('games', [])
        print(f"  Games ({len(games)}):")
        for i, g in enumerate(games):
            print(f"    {i+1}. {g['title']}")
        if not games:
            print("    (none)")
        print(f"\n  1. Add a game")
        print(f"  2. Remove a game")
        print(f"  3. Add multiple games")
        print(f"  4. Back")

        sel = input("\nSelect: ").strip()

        if sel == '1':
            title = input("Game title: ").strip()
            if title:
                db.profiles.update_one(
                    {"code": code},
                    {"$push": {"games": {"title": title, "addedAt": datetime.utcnow()}}}
                )
                profile = db.profiles.find_one({"code": code})
                print(f'"{title}" added.')
        elif sel == '2':
            if not games:
                print("No games to remove.")
                continue
            num = input("Game number to remove: ").strip()
            try:
                n = int(num) - 1
                if 0 <= n < len(games):
                    removed = games[n]
                    db.profiles.update_one(
                        {"code": code},
                        {"$pull": {"games": {"title": removed["title"]}}}
                    )
                    profile = db.profiles.find_one({"code": code})
                    print(f'"{removed["title"]}" removed.')
                else:
                    print("Invalid number.")
            except ValueError:
                print("Invalid input.")
        elif sel == '3':
            print("Enter game titles one per line. Type 'done' when finished.")
            while True:
                title = input("  Game: ").strip()
                if title.lower() == 'done':
                    break
                if title:
                    db.profiles.update_one(
                        {"code": code},
                        {"$push": {"games": {"title": title, "addedAt": datetime.utcnow()}}}
                    )
                    print(f'  "{title}" added.')
            profile = db.profiles.find_one({"code": code})
        elif sel == '4':
            break

def delete_profile(db):
    list_profiles(db)
    profiles = list(db.profiles.find())
    if not profiles:
        return

    choice = input("Enter profile number to delete (or 'cancel'): ").strip()
    if choice == 'cancel':
        return

    try:
        idx = int(choice) - 1
        if idx < 0 or idx >= len(profiles):
            print("Invalid selection.")
            return
    except ValueError:
        print("Invalid input.")
        return

    profile = profiles[idx]
    confirm = input(f"Delete '{profile['name']}'? (yes/no): ").strip().lower()
    if confirm == 'yes':
        db.profiles.delete_one({"code": profile['code']})
        print("Deleted.")
    else:
        print("Cancelled.")

def manage_ip(db):
    list_profiles(db)
    profiles = list(db.profiles.find())
    if not profiles:
        return

    choice = input("Enter profile number (or 'cancel'): ").strip()
    if choice == 'cancel':
        return

    try:
        idx = int(choice) - 1
        if idx < 0 or idx >= len(profiles):
            print("Invalid selection.")
            return
    except ValueError:
        print("Invalid input.")
        return

    profile = profiles[idx]
    code = profile['code']
    settings = profile.get('settings', {})

    print(f"\nProfile: {profile['name']}")
    print(f"IP: {profile.get('ip') or 'None'}")
    print(f"IP Lock: {'On' if settings.get('ipLock') else 'Off'}")

    print("\n1. Toggle IP Lock")
    print("2. Clear IP")
    print("3. Set IP manually")
    print("4. Back")

    sel = input("Select: ").strip()

    if sel == '1':
        new_state = not settings.get('ipLock', False)
        db.profiles.update_one({"code": code}, {"$set": {"settings.ipLock": new_state}})
        print(f"IP Lock {'enabled' if new_state else 'disabled'}.")
    elif sel == '2':
        db.profiles.update_one({"code": code}, {"$set": {"ip": None}})
        print("IP cleared.")
    elif sel == '3':
        new_ip = input("Enter IP: ").strip()
        if new_ip:
            db.profiles.update_one({"code": code}, {"$set": {"ip": new_ip}})
            print(f"IP set to {new_ip}.")

def main():
    db = connect_db()
    print("=" * 40)
    print("  GameStop Online - Admin Panel")
    print("=" * 40)

    while True:
        print("\n1. Create new profile")
        print("2. List all profiles")
        print("3. Manage a profile (add/remove games)")
        print("4. Manage IP / Settings")
        print("5. Delete a profile")
        print("6. Exit")

        choice = input("\nSelect: ").strip()

        if choice == '1':
            create_profile(db)
        elif choice == '2':
            list_profiles(db)
        elif choice == '3':
            manage_profile(db)
        elif choice == '4':
            manage_ip(db)
        elif choice == '5':
            delete_profile(db)
        elif choice == '6':
            print("Goodbye!")
            sys.exit()
        else:
            print("Invalid option.")

if __name__ == "__main__":
    main()
