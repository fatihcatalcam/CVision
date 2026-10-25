"""Throwaway inboxes (mailinator, temp-mail and the like).

A verification code stops invented addresses but not these: they receive mail
for anyone, so a code sent there proves nothing about who signed up. The list
is the community-maintained one from the disposable-email-domains package;
upgrading the pinned version in requirements.txt is how it gets refreshed.
"""

from disposable_email_domains import blocklist


def is_disposable(email: str) -> bool:
    """True when the address's domain, or any parent of it, is a throwaway one."""
    domain = email.rsplit("@", 1)[-1].strip().lower().rstrip(".")
    parts = domain.split(".")
    # "x.mailinator.com" is as throwaway as "mailinator.com".
    return any(".".join(parts[i:]) in blocklist for i in range(len(parts) - 1))
