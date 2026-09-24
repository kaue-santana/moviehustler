# Envio de emails transacionais via SMTP do Gmail — smtplib é biblioteca
# padrão do Python, nenhum pacote novo pra instalar. Diferente de um provedor
# como Resend/SendGrid (que por política antispam só deixa mandar pra
# qualquer destinatário depois de verificar um domínio próprio), o Gmail
# deixa qualquer conta mandar pra qualquer endereço — porque quem está
# enviando é literalmente a sua conta, não uma API tentando se passar por
# remetente confiável em nome de um domínio.
import os
import smtplib
from email.mime.text import MIMEText

# GMAIL_EMAIL é a conta que manda o email (aparece como remetente pra quem
# recebe). GMAIL_APP_SENHA NÃO é a senha normal da conta — é uma "senha de
# app" de 16 caracteres, gerada em myaccount.google.com/apppasswords, que só
# existe depois de ativar a verificação em duas etapas. O Gmail exige isso
# porque a senha normal da conta não pode ser usada por programas externos.
GMAIL_EMAIL = os.environ["GMAIL_EMAIL"]
GMAIL_APP_SENHA = os.environ["GMAIL_APP_SENHA"]

# Base da URL do frontend pra montar o link do email — em produção (Vercel)
# frontend e backend são o mesmo domínio (ver capítulo 14 do caderno de
# estudo), então o padrão local (porta 8000, onde o FastAPI já serve o
# frontend) cobre os dois casos sem precisar de configuração extra.
URL_FRONTEND = os.environ.get("URL_FRONTEND", "http://localhost:8000")


def enviar_email_redefinicao(destinatario: str, token: str) -> None:
    link = f"{URL_FRONTEND}/redefinir-senha.html?token={token}"

    mensagem = MIMEText(
        f"""
        <p>Alguém (esperamos que você) pediu pra redefinir a senha da sua conta no MovieHustler.</p>
        <p><a href="{link}">Clique aqui pra escolher uma senha nova</a></p>
        <p>Esse link expira em 30 minutos. Se você não pediu isso, pode ignorar este email.</p>
        """,
        "html",
    )
    mensagem["Subject"] = "Redefinir sua senha — MovieHustler"
    mensagem["From"] = GMAIL_EMAIL
    mensagem["To"] = destinatario

    # SMTP_SSL (porta 465), não SMTP+starttls: conexão já nasce criptografada
    # de ponta a ponta, em vez de começar sem criptografia e "atualizar" no
    # meio do caminho — uma linha a menos pra se preocupar em esquecer.
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
        servidor.login(GMAIL_EMAIL, GMAIL_APP_SENHA)
        servidor.sendmail(GMAIL_EMAIL, [destinatario], mensagem.as_string())
